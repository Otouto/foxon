import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export interface ExerciseAnalytics {
  id: string;
  name: string;
  muscleGroup: string | null;
  peakPerformance: {
    weight: number;
    reps: number;
    isBodyweight: boolean;
  } | null;
  devotionDots: boolean[]; // Variable length array (1-12 weeks of activity)
  actualWeeksTracked: number; // Actual number of weeks being displayed (1-12)
  consistency: number; // 0-1 representing percentage
  chips: ('foundation' | 'missing')[];
}

export class ExerciseAnalyticsService {
  
  static async getAllExerciseAnalytics(): Promise<ExerciseAnalytics[]> {
    const userId = getCurrentUserId();
    
    // Get all exercises the user has performed
    const exercisesWithSessions = await prisma.exercise.findMany({
      where: {
        sessionExercises: {
          some: {
            session: {
              userId: userId
            }
          }
        }
      },
      include: {
        muscleGroup: true,
        sessionExercises: {
          where: {
            session: {
              userId: userId
            }
          },
          include: {
            session: true,
            sessionSets: {
              where: {
                completed: true
              }
            }
          }
        }
      }
    });

    const analytics = await Promise.all(
      exercisesWithSessions.map(async (exercise) => {
        const peakPerformance = this.calculatePeakPerformance(exercise.sessionExercises);
        const devotionData = this.calculateDevotionDots(exercise.sessionExercises);
        const consistency = this.calculateConsistency(exercise.sessionExercises);
        const chips = this.determineChips(consistency);

        return {
          id: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup?.name || null,
          peakPerformance,
          devotionDots: devotionData.dots,
          actualWeeksTracked: devotionData.weeksTracked,
          consistency,
          chips
        };
      })
    );

    // Sort by name for consistent ordering
    return analytics.sort((a, b) => a.name.localeCompare(b.name));
  }

  private static calculatePeakPerformance(sessionExercises: Array<{
    sessionSets: Array<{
      load: Prisma.Decimal;
      reps: number;
      completed: boolean;
    }>;
  }>): ExerciseAnalytics['peakPerformance'] {
    let maxScore = 0;
    let bestSet: { load: Prisma.Decimal; reps: number } | null = null;

    for (const sessionExercise of sessionExercises) {
      for (const set of sessionExercise.sessionSets) {
        // Calculate a score: weight * reps (for bodyweight, weight = 1)
        const weight = parseFloat(set.load.toString());
        const score = weight * set.reps;
        
        if (score > maxScore) {
          maxScore = score;
          bestSet = set;
        }
      }
    }

    if (!bestSet) return null;

    const weight = parseFloat(bestSet.load.toString());
    const isBodyweight = weight === 0;

    return {
      weight: isBodyweight ? 0 : weight,
      reps: bestSet.reps,
      isBodyweight
    };
  }

  private static calculateDevotionDots(sessionExercises: Array<{
    session: {
      date: Date;
    };
  }>): { dots: boolean[]; weeksTracked: number } {
    const earliestDate = this.getEarliestSessionDate(sessionExercises);
    if (!earliestDate) return { dots: [], weeksTracked: 0 };

    const now = new Date();
    const dots: boolean[] = [];
    
    // Calculate weeks since first session, capped at 12 weeks
    const weeksSinceStart = Math.ceil((now.getTime() - earliestDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weeksToShow = Math.min(12, Math.max(1, weeksSinceStart));
    
    // Calculate dots for the relevant period (most recent first, then reverse)
    for (let week = 0; week < weeksToShow; week++) {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (week * 7));
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      // Check if exercise was performed this week
      const hasActivity = sessionExercises.some(sessionExercise => {
        const sessionDate = new Date(sessionExercise.session.date);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });

      dots.push(hasActivity);
    }

    // Return variable-length array without padding
    return {
      dots: dots.reverse(), // Reverse to show oldest week first (left) to newest week last (right)
      weeksTracked: weeksToShow
    };
  }

  private static calculateConsistency(sessionExercises: Array<{
    session: {
      date: Date;
    };
  }>): number {
    if (sessionExercises.length === 0) return 0;

    const earliestDate = this.getEarliestSessionDate(sessionExercises);
    if (!earliestDate) return 0;

    const now = new Date();
    
    // Calculate actual weeks since first session, capped at 12 weeks
    const weeksSinceStart = Math.ceil((now.getTime() - earliestDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const totalAvailableWeeks = Math.min(12, Math.max(1, weeksSinceStart));
    
    // Calculate the time window we're considering
    const windowStartWeeks = Math.min(12, weeksSinceStart);
    const windowStart = new Date(now);
    windowStart.setDate(now.getDate() - (windowStartWeeks * 7));

    // Get unique weeks with sessions within the available period
    const weeksSeen = new Set<string>();
    
    sessionExercises.forEach(sessionExercise => {
      const sessionDate = new Date(sessionExercise.session.date);
      
      // Only count sessions within the available window
      if (sessionDate >= windowStart && sessionDate <= now) {
        const weekKey = this.getWeekKey(sessionDate);
        weeksSeen.add(weekKey);
      }
    });

    // Calculate consistency as weeks with activity / actual available weeks
    return weeksSeen.size / totalAvailableWeeks;
  }

  private static determineChips(consistency: number): ('foundation' | 'missing')[] {
    const chips: ('foundation' | 'missing')[] = [];
    
    if (consistency >= 0.8) {
      chips.push('foundation');
    }
    
    if (consistency < 0.3) {
      chips.push('missing');
    }
    
    return chips;
  }

  private static getWeekKey(date: Date): string {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek.toISOString().split('T')[0];
  }

  private static getEarliestSessionDate(sessionExercises: Array<{
    session: {
      date: Date;
    };
  }>): Date | null {
    if (sessionExercises.length === 0) return null;
    
    const dates = sessionExercises.map(se => new Date(se.session.date));
    return new Date(Math.min(...dates.map(d => d.getTime())));
  }
}