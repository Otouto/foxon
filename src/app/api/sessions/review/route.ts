import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, getCurrentUser } from '@/lib/auth';
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
    const userId = getCurrentUserId();
    const user = getCurrentUser();
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'sessions';

    if (tab === 'sessions') {
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

      const sessionReviewData: SessionReviewData[] = await Promise.all(
        sessions.map(async (session) => {
          // Calculate narrative for each session
          let narrative: string | null = null;
          try {
            const narrativeContext = await NarrativeService.getNarrativeContext(
              userId,
              session.id,
              session.date
            );
            narrative = NarrativeService.calculateNarrative(narrativeContext);
          } catch (error) {
            console.error(`Failed to calculate narrative for session ${session.id}:`, error);
          }

          return {
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
            narrative: narrative || undefined
          };
        })
      );

      return NextResponse.json({ 
        sessions: sessionReviewData,
        weeklyGoal: user.weeklyGoal
      });
    } 
    
    if (tab === 'exercises') {
      // Get exercise analytics
      const exerciseAnalytics = await ExerciseAnalyticsService.getAllExerciseAnalytics();
      return NextResponse.json({ exercises: exerciseAnalytics });
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
