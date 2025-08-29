import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export interface ExerciseAnalytics {
  id: string;
  name: string;
  muscleGroup: string | null;
  peakPerformance: {
    weight: number;
    reps: number;
    isBodyweight: boolean;
  } | null;
  devotionDots: boolean[]; // 12 weeks of activity (true = active, false = inactive)
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
        const devotionDots = this.calculateDevotionDots(exercise.sessionExercises);
        const consistency = this.calculateConsistency(exercise.sessionExercises);
        const chips = this.determineChips(consistency);

        return {
          id: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup?.name || null,
          peakPerformance,
          devotionDots,
          consistency,
          chips
        };
      })
    );

    // Sort by name for consistent ordering
    return analytics.sort((a, b) => a.name.localeCompare(b.name));
  }

  private static calculatePeakPerformance(sessionExercises: any[]): ExerciseAnalytics['peakPerformance'] {
    let maxScore = 0;
    let bestSet: any = null;

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

  private static calculateDevotionDots(sessionExercises: any[]): boolean[] {
    const startDate = new Date('2024-07-01');
    const dots: boolean[] = [];
    
    // Calculate 12 weeks from start date
    for (let week = 0; week < 12; week++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (week * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Check if exercise was performed this week
      const hasActivity = sessionExercises.some(sessionExercise => {
        const sessionDate = new Date(sessionExercise.session.date);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });

      dots.push(hasActivity);
    }

    return dots;
  }

  private static calculateConsistency(sessionExercises: any[]): number {
    if (sessionExercises.length === 0) return 0;

    // Get unique weeks with sessions
    const weeksSeen = new Set<string>();
    
    sessionExercises.forEach(sessionExercise => {
      const sessionDate = new Date(sessionExercise.session.date);
      const weekKey = this.getWeekKey(sessionDate);
      weeksSeen.add(weekKey);
    });

    // Calculate consistency as weeks with activity / total weeks since July 1, 2024
    const startDate = new Date('2024-07-01');
    const now = new Date();
    const totalWeeks = Math.min(12, Math.ceil((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    
    return weeksSeen.size / Math.max(1, totalWeeks);
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
}