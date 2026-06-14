import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NarrativeService } from '@/services/NarrativeService';
import { ExerciseAnalyticsService } from '@/services/ExerciseAnalyticsService';

export interface SessionReviewData {
  id: string;
  date: Date;
  workoutTitle: string | null;
  status: string;
  devotionScore?: number | null;
  devotionGrade?: string | null;
  effort?: string;
  vibeLine?: string;
  note?: string;
  duration?: number;
  narrative?: string;
}

export interface ExerciseStatsData {
  exerciseId: string;
  exerciseName: string;
  bestSet: {
    load: number;
    reps: number;
  } | null;
  totalVolume: number;
  sessionCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'sessions';

    if (tab === 'sessions') {
      // Get user's weeklyGoal from DB
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { weeklyGoal: true },
      });

      // Get sessions with seals for review
      const sessions = await prisma.session.findMany({
        where: {
          userId,
          status: 'FINISHED'
        },
        include: {
          workout: {
            select: { title: true }
          },
          sessionSeal: true
        },
        orderBy: { date: 'desc' }
      });

      // Narratives are derived in memory from the session list above — no
      // per-session queries (previously an N+1 of 4 queries × every session).
      const narratives = NarrativeService.narrativesForSessions(
        sessions.map((s) => ({
          id: s.id,
          date: s.date,
          workoutTitle: s.workout?.title ?? null,
          devotionScore: s.devotionScore,
        }))
      );

      const sessionReviewData: SessionReviewData[] = sessions.map((session) => ({
        id: session.id,
        date: session.date,
        workoutTitle: session.workout?.title || null,
        status: session.status,
        devotionScore: session.devotionScore,
        devotionGrade: session.devotionGrade,
        effort: session.sessionSeal?.effort,
        vibeLine: session.sessionSeal?.vibeLine,
        note: session.sessionSeal?.note || undefined,
        duration: session.duration || undefined,
        narrative: narratives.get(session.id) || undefined,
      }));

      return NextResponse.json({
        sessions: sessionReviewData,
        weeklyGoal: user?.weeklyGoal ?? 3
      });
    }

    if (tab === 'exercises') {
      // Get categorized exercise analytics
      const categorizedExercises = await ExerciseAnalyticsService.getCategorizedExerciseAnalytics();
      return NextResponse.json(categorizedExercises);
    }

    return NextResponse.json({ error: 'Invalid tab parameter' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching review data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review data' },
      { status: 500 }
    );
  }
}
