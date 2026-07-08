import { NextRequest, NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { SessionStatus, SetType } from '@prisma/client';
import { DevotionScoringService } from '@/services/DevotionScoringService';
import { FoxLevelService } from '@/services/FoxLevelService';
import { OuraService } from '@/services/OuraService';

interface CompletedSessionData {
  workoutId: string;
  workoutTitle: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  /** HealthKit metrics recorded by the watch companion; absent for phone-logged sessions. */
  health?: {
    avgHeartRate?: number | null;
    maxHeartRate?: number | null;
    activeCalories?: number | null;
  };
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    order: number;
    notes?: string;
    sets: Array<{
      type: string;
      load: number;
      reps: number;
      completed: boolean;
      order: number;
      notes?: string;
    }>;
  }>;
}

function roundedOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { sessionData }: { sessionData: CompletedSessionData } = await request.json();

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session data is required' },
        { status: 400 }
      );
    }

    // Idempotency: the mobile client retries this request from a durable
    // outbox after network failures. A session is uniquely identified by
    // (user, workout, startTime) — if it already exists, the first attempt
    // succeeded and we just return it instead of double-logging.
    const existingSession = await prisma.session.findFirst({
      where: {
        userId,
        workoutId: sessionData.workoutId,
        date: new Date(sessionData.startTime),
        status: SessionStatus.FINISHED,
      },
      select: {
        id: true,
        devotionScore: true,
        devotionGrade: true,
        devotionPillars: true,
        devotionDeviations: true,
      },
    });

    if (existingSession) {
      return NextResponse.json({
        success: true,
        sessionId: existingSession.id,
        devotionScore: existingSession.devotionScore,
        devotionGrade: existingSession.devotionGrade,
        devotionPillars: existingSession.devotionPillars,
        devotionDeviations: existingSession.devotionDeviations,
        message: 'Session already saved'
      });
    }

    // Create the completed session in the database
    const session = await prisma.$transaction(async (tx) => {
      // Create the session
      const newSession = await tx.session.create({
        data: {
          userId,
          workoutId: sessionData.workoutId,
          status: SessionStatus.FINISHED,
          date: new Date(sessionData.startTime),
          duration: sessionData.duration,
          avgHeartRate: roundedOrNull(sessionData.health?.avgHeartRate),
          maxHeartRate: roundedOrNull(sessionData.health?.maxHeartRate),
          activeCalories: roundedOrNull(sessionData.health?.activeCalories),
          createdAt: new Date(sessionData.startTime),
          updatedAt: new Date(sessionData.endTime),
        }
      });

      // Create session exercises (in parallel), then their sets (in parallel)
      await Promise.all(
        sessionData.exercises.map(async (exerciseData) => {
          const sessionExercise = await tx.sessionExercise.create({
            data: {
              sessionId: newSession.id,
              exerciseId: exerciseData.exerciseId,
              order: exerciseData.order,
              notes: exerciseData.notes,
            }
          });

          const setsData = exerciseData.sets.map(set => ({
            sessionExerciseId: sessionExercise.id,
            type: set.type as SetType,
            load: set.load,
            reps: set.reps,
            completed: set.completed,
            order: set.order,
            notes: set.notes,
          }));

          if (setsData.length > 0) {
            await tx.sessionSet.createMany({ data: setsData });
          }
        })
      );

      return newSession;
    }, {
      maxWait: 10000, // Maximum wait time: 10 seconds
      timeout: 30000, // Maximum duration: 30 seconds
    });

    // Devotion score: it's one workout fetch + in-memory math, so await it
    // with a short budget and return it in the response (kills the client-side
    // "Crunching your devotion…" poll in the common case). If it's slow, fall
    // back to finishing in the background and the client polls as before.
    let devotionResult: Awaited<
      ReturnType<typeof DevotionScoringService.updateSessionWithDevotionScore>
    > = null;

    if (sessionData.workoutId) {
      const actualExercises = sessionData.exercises.map(ex => ({
        name: ex.exerciseName,
        sets: ex.sets.map(set => ({
          load: set.load,
          reps: set.reps,
          completed: set.completed,
          order: set.order
        }))
      }));

      const scoringPromise = DevotionScoringService.updateSessionWithDevotionScore(
        session.id,
        sessionData.workoutId,
        actualExercises
      ).then((result) => {
        FoxLevelService.onSessionCompleted(userId).catch(error => {
          console.error('Failed to evaluate fox level for session:', session.id, error);
        });
        return result;
      });

      const SCORING_BUDGET_MS = 3000;
      devotionResult = await Promise.race([
        scoringPromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), SCORING_BUDGET_MS)),
      ]);
    } else {
      // No workout template — still evaluate fox level
      FoxLevelService.onSessionCompleted(userId).catch(error => {
        console.error('Failed to evaluate fox level for session:', session.id, error);
      });
    }

    // Attach today's Oura sleep/readiness scores in the background
    // (no-op when the user hasn't connected Oura; the daily cron repairs misses)
    after(() =>
      OuraService.syncRecent(userId).catch(error =>
        console.error('Oura sync after session completion failed:', error)
      )
    );

    // Invalidate dashboard cache so it shows fresh data on next navigation
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      devotionScore: devotionResult?.CDS ?? null,
      devotionGrade: devotionResult?.grade ?? null,
      devotionPillars: devotionResult?.pillars ?? null,
      devotionDeviations: devotionResult?.deviations ?? null,
      message: 'Session saved successfully'
    });

  } catch (error) {
    console.error('Failed to save completed session:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save session' },
      { status: 500 }
    );
  }
}
