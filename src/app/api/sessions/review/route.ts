import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
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
        orderBy: { date: 'desc' },
        take: limit
      });

      const sessionReviewData: SessionReviewData[] = sessions.map(session => {
        // Calculate duration in minutes from createdAt to updatedAt
        const durationInMinutes = session.updatedAt && session.createdAt 
          ? Math.round((session.updatedAt.getTime() - session.createdAt.getTime()) / (1000 * 60))
          : undefined;

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
          duration: durationInMinutes
        };
      });

      return NextResponse.json({ sessions: sessionReviewData });
    } 
    
    if (tab === 'exercises') {
      // Get exercise statistics
      const exerciseStats = await prisma.$queryRaw<Array<{
        exercise_id: string;
        exercise_name: string;
        best_load: number;
        best_reps: number;
        total_volume: number;
        session_count: bigint;
      }>>`
        WITH exercise_stats AS (
          SELECT 
            e.id as exercise_id,
            e.name as exercise_name,
            MAX(ss.load * ss.reps) as max_volume_per_set,
            SUM(ss.load * ss.reps) as total_volume,
            COUNT(DISTINCT s.id) as session_count,
            -- Get the best set (highest load * reps)
            (SELECT ss2.load FROM session_sets ss2 
             JOIN session_exercises se2 ON ss2.session_exercise_id = se2.id 
             JOIN sessions s2 ON se2.session_id = s2.id
             WHERE se2.exercise_id = e.id AND s2.user_id = ${userId} AND ss2.completed = true
             ORDER BY (ss2.load * ss2.reps) DESC LIMIT 1) as best_load,
            (SELECT ss2.reps FROM session_sets ss2 
             JOIN session_exercises se2 ON ss2.session_exercise_id = se2.id 
             JOIN sessions s2 ON se2.session_id = s2.id
             WHERE se2.exercise_id = e.id AND s2.user_id = ${userId} AND ss2.completed = true
             ORDER BY (ss2.load * ss2.reps) DESC LIMIT 1) as best_reps
          FROM exercises e
          JOIN session_exercises se ON e.id = se.exercise_id
          JOIN session_sets ss ON se.id = ss.session_exercise_id
          JOIN sessions s ON se.session_id = s.id
          WHERE s.user_id = ${userId} AND s.status = 'FINISHED' AND ss.completed = true
          GROUP BY e.id, e.name
        )
        SELECT * FROM exercise_stats
        ORDER BY total_volume DESC
        LIMIT ${limit}
      `;

      const exerciseReviewData: ExerciseStatsData[] = exerciseStats.map(stat => ({
        exerciseId: stat.exercise_id,
        exerciseName: stat.exercise_name,
        bestSet: stat.best_load && stat.best_reps ? {
          load: Number(stat.best_load),
          reps: stat.best_reps
        } : null,
        totalVolume: Number(stat.total_volume),
        sessionCount: Number(stat.session_count)
      }));

      return NextResponse.json({ exercises: exerciseReviewData });
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
