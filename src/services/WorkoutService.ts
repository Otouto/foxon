import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import type { 
  WorkoutListItem, 
  WorkoutDetails, 
  CreateWorkoutRequest, 
  UpdateWorkoutRequest 
} from '@/lib/types/workout';

export class WorkoutService {
  /**
   * Get all workouts for the current user (for workout list page)
   */
  static async getUserWorkouts(): Promise<WorkoutListItem[]> {
    const userId = getCurrentUserId();
    
    const workouts = await prisma.workout.findMany({
      where: {
        userId: userId,
      },
      include: {
        workoutItems: {
          include: {
            workoutItemSets: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return workouts.map((workout: any) => {
      const exerciseCount = workout.workoutItems.length;
      const totalSets = workout.workoutItems.reduce(
        (total: number, item: any) => total + item.workoutItemSets.length, 
        0
      );
      
      // Estimate: 3 minutes per set + 1 minute rest between exercises
      const estimatedDuration = totalSets * 3 + Math.max(0, exerciseCount - 1);

      return {
        id: workout.id,
        title: workout.title,
        description: workout.description,
        exerciseCount,
        estimatedDuration,
        createdAt: workout.createdAt,
        updatedAt: workout.updatedAt,
      };
    });
  }

  /**
   * Get detailed workout by ID (for workout detail page)
   */
  static async getWorkoutById(workoutId: string): Promise<WorkoutDetails | null> {
    const userId = getCurrentUserId();
    
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: userId,
      },
      include: {
        workoutItems: {
          include: {
            exercise: {
              include: {
                muscleGroup: {
                  select: {
                    name: true,
                  },
                },
                equipment: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            workoutItemSets: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!workout) {
      return null;
    }

    const exerciseCount = workout.workoutItems.length;
    const totalSets = workout.workoutItems.reduce(
      (total: number, item: any) => total + item.workoutItemSets.length, 
      0
    );
    const estimatedDuration = totalSets * 3 + Math.max(0, exerciseCount - 1);

    return {
      id: workout.id,
      title: workout.title,
      description: workout.description,
      exerciseCount,
      estimatedDuration,
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,
      items: workout.workoutItems.map((item: any) => ({
        id: item.id,
        order: item.order,
        notes: item.notes,
        exercise: {
          id: item.exercise.id,
          name: item.exercise.name,
          description: item.exercise.description,
          muscleGroup: item.exercise.muscleGroup,
          equipment: item.exercise.equipment,
        },
        sets: item.workoutItemSets.map((set: any) => ({
          id: set.id,
          type: set.type,
          targetLoad: Number(set.targetLoad),
          targetReps: set.targetReps,
          order: set.order,
          notes: set.notes,
        })),
      })),
    };
  }

  /**
   * Create a new workout
   */
  static async createWorkout(data: CreateWorkoutRequest): Promise<WorkoutDetails> {
    const userId = getCurrentUserId();

    const workout = await prisma.workout.create({
      data: {
        userId,
        title: data.title,
        description: data.description || null,
        workoutItems: {
          create: data.items.map((item) => ({
            exerciseId: item.exerciseId,
            order: item.order,
            notes: item.notes || null,
            workoutItemSets: {
              create: item.sets.map((set) => ({
                type: set.type,
                targetLoad: set.targetLoad,
                targetReps: set.targetReps,
                order: set.order,
                notes: set.notes || null,
              })),
            },
          })),
        },
      },
      include: {
        workoutItems: {
          include: {
            exercise: {
              include: {
                muscleGroup: {
                  select: {
                    name: true,
                  },
                },
                equipment: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            workoutItemSets: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Transform to match our interface
    const exerciseCount = workout.workoutItems.length;
    const totalSets = workout.workoutItems.reduce(
      (total: number, item: any) => total + item.workoutItemSets.length, 
      0
    );
    const estimatedDuration = totalSets * 3 + Math.max(0, exerciseCount - 1);

    return {
      id: workout.id,
      title: workout.title,
      description: workout.description,
      exerciseCount,
      estimatedDuration,
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,
      items: workout.workoutItems.map((item: any) => ({
        id: item.id,
        order: item.order,
        notes: item.notes,
        exercise: {
          id: item.exercise.id,
          name: item.exercise.name,
          description: item.exercise.description,
          muscleGroup: item.exercise.muscleGroup,
          equipment: item.exercise.equipment,
        },
        sets: item.workoutItemSets.map((set: any) => ({
          id: set.id,
          type: set.type,
          targetLoad: Number(set.targetLoad),
          targetReps: set.targetReps,
          order: set.order,
          notes: set.notes,
        })),
      })),
    };
  }

  /**
   * Update an existing workout
   */
  static async updateWorkout(workoutId: string, data: UpdateWorkoutRequest): Promise<WorkoutDetails | null> {
    const userId = getCurrentUserId();

    // First verify the workout belongs to the user
    const existingWorkout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: userId,
      },
    });

    if (!existingWorkout) {
      return null;
    }

    // Update the workout
    const workout = await prisma.workout.update({
      where: {
        id: workoutId,
      },
      data: {
        title: data.title,
        description: data.description,
        // Note: For now, we'll handle items updates separately
        // In a full implementation, you'd need complex logic to handle
        // adding/removing/updating workout items and sets
      },
      include: {
        workoutItems: {
          include: {
            exercise: {
              include: {
                muscleGroup: {
                  select: {
                    name: true,
                  },
                },
                equipment: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            workoutItemSets: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    // Transform to match our interface
    const exerciseCount = workout.workoutItems.length;
    const totalSets = workout.workoutItems.reduce(
      (total: number, item: any) => total + item.workoutItemSets.length, 
      0
    );
    const estimatedDuration = totalSets * 3 + Math.max(0, exerciseCount - 1);

    return {
      id: workout.id,
      title: workout.title,
      description: workout.description,
      exerciseCount,
      estimatedDuration,
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,
      items: workout.workoutItems.map((item: any) => ({
        id: item.id,
        order: item.order,
        notes: item.notes,
        exercise: {
          id: item.exercise.id,
          name: item.exercise.name,
          description: item.exercise.description,
          muscleGroup: item.exercise.muscleGroup,
          equipment: item.exercise.equipment,
        },
        sets: item.workoutItemSets.map((set: any) => ({
          id: set.id,
          type: set.type,
          targetLoad: Number(set.targetLoad),
          targetReps: set.targetReps,
          order: set.order,
          notes: set.notes,
        })),
      })),
    };
  }

  /**
   * Delete a workout
   */
  static async deleteWorkout(workoutId: string): Promise<boolean> {
    const userId = getCurrentUserId();

    try {
      await prisma.workout.deleteMany({
        where: {
          id: workoutId,
          userId: userId,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to delete workout:', error);
      return false;
    }
  }

  /**
   * Get workout count for the current user
   */
  static async getUserWorkoutCount(): Promise<number> {
    const userId = getCurrentUserId();
    
    return prisma.workout.count({
      where: {
        userId: userId,
      },
    });
  }
}