import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';
import { SessionStatus, SetType } from '@prisma/client';
import { DevotionScoringService } from '@/services/DevotionScoringService';

interface CompletedSessionData {
  workoutId: string;
  workoutTitle: string;
  startTime: Date;
  endTime: Date;
  duration: number;
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

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = getCurrentUserId();
    const { sessionData }: { sessionData: CompletedSessionData } = await request.json();

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session data is required' },
        { status: 400 }
      );
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
          createdAt: new Date(sessionData.startTime),
          updatedAt: new Date(sessionData.endTime),
        }
      });

      // Create session exercises and sets
      for (const exerciseData of sessionData.exercises) {
        const sessionExercise = await tx.sessionExercise.create({
          data: {
            sessionId: newSession.id,
            exerciseId: exerciseData.exerciseId,
            order: exerciseData.order,
            notes: exerciseData.notes,
          }
        });

        // Create session sets
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
          await Promise.all(
            setsData.map(setData => tx.sessionSet.create({ data: setData }))
          );
        }
      }

      return newSession;
    }, {
      maxWait: 10000, // Maximum wait time: 10 seconds
      timeout: 30000, // Maximum duration: 30 seconds
    });

    // Calculate and update devotion score (async, don't wait for it)
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

      // Update devotion score in background - don't block response
      DevotionScoringService.updateSessionWithDevotionScore(
        session.id,
        sessionData.workoutId,
        actualExercises
      ).catch(error => {
        console.error('Failed to calculate devotion score for session:', session.id, error);
      });
    }

    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
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
