import { prisma } from '@/lib/prisma';
import type { Exercise, ExerciseListItem } from '@/lib/types/exercise';

export class ExerciseService {
  /**
   * Get all exercises for selection in workout creation
   */
  static async getAllExercises(): Promise<ExerciseListItem[]> {
    const exercises = await prisma.exercise.findMany({
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
      orderBy: [
        {
          muscleGroup: {
            name: 'asc',
          },
        },
        {
          name: 'asc',
        },
      ],
    });

    return exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup?.name || null,
      equipment: exercise.equipment?.name || null,
    }));
  }

  /**
   * Get detailed exercise by ID
   */
  static async getExerciseById(exerciseId: string): Promise<Exercise | null> {
    const exercise = await prisma.exercise.findUnique({
      where: {
        id: exerciseId,
      },
      include: {
        muscleGroup: {
          select: {
            id: true,
            name: true,
          },
        },
        equipment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!exercise) {
      return null;
    }

    return {
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
    };
  }

  /**
   * Search exercises by name and muscle group
   */
  static async searchExercises(query: string): Promise<ExerciseListItem[]> {
    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            muscleGroup: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
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
      orderBy: [
        {
          muscleGroup: {
            name: 'asc',
          },
        },
        {
          name: 'asc',
        },
      ],
      take: 50, // Limit results for performance
    });

    return exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup?.name || null,
      equipment: exercise.equipment?.name || null,
    }));
  }
}