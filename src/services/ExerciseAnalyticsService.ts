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

export interface CategorizedExerciseAnalytics {
  activeExercises: ExerciseAnalytics[];
  archivedExercises: ExerciseAnalytics[];
}

export class ExerciseAnalyticsService {
  
  static async getCategorizedExerciseAnalytics(): Promise<CategorizedExerciseAnalytics> {
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

    // Get exercises from active workouts
    const activeWorkoutExercises = await prisma.exercise.findMany({
      where: {
        workoutItems: {
          some: {
            workout: {
              userId: userId,
              status: 'ACTIVE'
            }
          }
        }
      },
      select: {
        id: true
      }
    });

    const activeExerciseIds = new Set(activeWorkoutExercises.map(ex => ex.id));

    const allAnalytics = await Promise.all(
      exercisesWithSessions.map(async (exercise) => {
        const peakPerformance = this.calculatePeakPerformance(exercise.sessionExercises);
        const devotionData = await this.calculateDevotionDots(exercise.id, exercise.sessionExercises);
        const consistency = await this.calculateConsistency(exercise.id, exercise.sessionExercises);
        const chips = this.determineChips(consistency);

        return {
          id: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup?.name || null,
          peakPerformance,
          devotionDots: devotionData.dots,
          actualWeeksTracked: devotionData.weeksTracked,
          consistency,
          chips,
          isActive: activeExerciseIds.has(exercise.id)
        };
      })
    );

    // Separate active and archived exercises
    const activeExercises = allAnalytics
      .filter(exercise => exercise.isActive)
      .map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        peakPerformance: exercise.peakPerformance,
        devotionDots: exercise.devotionDots,
        actualWeeksTracked: exercise.actualWeeksTracked,
        consistency: exercise.consistency,
        chips: exercise.chips
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const archivedExercises = allAnalytics
      .filter(exercise => !exercise.isActive)
      .map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        peakPerformance: exercise.peakPerformance,
        devotionDots: exercise.devotionDots,
        actualWeeksTracked: exercise.actualWeeksTracked,
        consistency: exercise.consistency,
        chips: exercise.chips
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      activeExercises,
      archivedExercises
    };
  }
  
  static async getExerciseHistory(exerciseId: string, userId: string) {
    // Get all sessions where this exercise was performed, ordered by date (newest first)
    const sessions = await prisma.session.findMany({
      where: {
        userId: userId,
        sessionExercises: {
          some: {
            exerciseId: exerciseId
          }
        }
      },
      include: {
        workout: {
          select: {
            title: true
          }
        },
        sessionExercises: {
          where: {
            exerciseId: exerciseId
          },
          include: {
            exercise: {
              select: {
                name: true,
                muscleGroup: {
                  select: {
                    name: true
                  }
                }
              }
            },
            sessionSets: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return sessions.map(session => ({
      id: session.id,
      date: session.date,
      workoutTitle: session.workout?.title || null,
      duration: session.duration,
      devotionScore: session.devotionScore,
      sessionExercise: {
        ...session.sessionExercises[0],
        sessionSets: session.sessionExercises[0]?.sessionSets.map(set => ({
          ...set,
          load: parseFloat(set.load.toString())
        })) || []
      }
    }));
  }

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
        const devotionData = await this.calculateDevotionDots(exercise.id, exercise.sessionExercises);
        const consistency = await this.calculateConsistency(exercise.id, exercise.sessionExercises);
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

  private static async calculateDevotionDots(exerciseId: string, sessionExercises: Array<{
    session: {
      date: Date;
    };
  }>): Promise<{ dots: boolean[]; weeksTracked: number }> {
    const earliestDate = await this.getEarliestWorkoutSessionDate(exerciseId);
    if (!earliestDate) return { dots: [], weeksTracked: 0 };

    const now = new Date();
    const dots: boolean[] = [];
    
    // Calculate weeks since first session using proper Monday-Sunday boundaries, capped at 12 weeks
    const weeksSinceStart = this.getWeeksBetweenDates(earliestDate, now);
    const weeksToShow = Math.min(12, Math.max(1, weeksSinceStart));
    
    // Calculate dots for the relevant period (most recent first, then reverse)
    for (let week = 0; week < weeksToShow; week++) {
      // Calculate current week's Monday-Sunday boundaries
      const referenceDate = new Date(now);
      referenceDate.setDate(now.getDate() - (week * 7));
      
      // Get start of week (Monday)
      const dayOfWeek = referenceDate.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days from Monday
      
      const weekStart = new Date(referenceDate);
      weekStart.setDate(referenceDate.getDate() - daysFromMonday);
      weekStart.setHours(0, 0, 0, 0);
      
      // Get end of week (Sunday)
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

    // Return variable-length array without padding
    return {
      dots: dots.reverse(), // Reverse to show oldest week first (left) to newest week last (right)
      weeksTracked: weeksToShow
    };
  }

  private static async calculateConsistency(exerciseId: string, sessionExercises: Array<{
    session: {
      date: Date;
    };
  }>): Promise<number> {
    if (sessionExercises.length === 0) return 0;

    const earliestDate = await this.getEarliestWorkoutSessionDate(exerciseId);
    if (!earliestDate) return 0;

    const now = new Date();
    
    // Calculate actual weeks since first session using proper Monday-Sunday boundaries, capped at 12 weeks
    const weeksSinceStart = this.getWeeksBetweenDates(earliestDate, now);
    const totalAvailableWeeks = Math.min(12, Math.max(1, weeksSinceStart));
    
    // Calculate the time window we're considering (go back the calculated number of weeks from current Monday)
    const currentMonday = this.getMondayOfWeek(now);
    const windowStart = new Date(currentMonday);
    windowStart.setDate(currentMonday.getDate() - ((totalAvailableWeeks - 1) * 7));

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
    
    if (consistency >= 0.75) {
      chips.push('foundation');
    }
    
    if (consistency < 0.4) {
      chips.push('missing');
    }
    
    return chips;
  }

  private static getWeekKey(date: Date): string {
    const startOfWeek = new Date(date);
    // Get Monday as start of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days from Monday
    startOfWeek.setDate(date.getDate() - daysFromMonday);
    return startOfWeek.toISOString().split('T')[0];
  }

  private static getMondayOfWeek(date: Date): Date {
    const monday = new Date(date);
    const dayOfWeek = date.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days from Monday
    monday.setDate(date.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private static getWeeksBetweenDates(startDate: Date, endDate: Date): number {
    const startMonday = this.getMondayOfWeek(startDate);
    const endMonday = this.getMondayOfWeek(endDate);
    const timeDiff = endMonday.getTime() - startMonday.getTime();
    return Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000)) + 1; // +1 to include both start and end weeks
  }

  private static async getEarliestWorkoutSessionDate(exerciseId: string): Promise<Date | null> {
    const userId = getCurrentUserId();
    
    // Find all workouts that contain this exercise
    const workoutsWithExercise = await prisma.workout.findMany({
      where: {
        userId: userId,
        workoutItems: {
          some: {
            exerciseId: exerciseId
          }
        }
      },
      select: {
        id: true
      }
    });

    if (workoutsWithExercise.length === 0) return null;

    const workoutIds = workoutsWithExercise.map(w => w.id);

    // Find the earliest session of ANY workout that contains this exercise
    const earliestSession = await prisma.session.findFirst({
      where: {
        userId: userId,
        workoutId: {
          in: workoutIds
        }
      },
      orderBy: {
        date: 'asc'
      },
      select: {
        date: true
      }
    });

    return earliestSession?.date || null;
  }

}