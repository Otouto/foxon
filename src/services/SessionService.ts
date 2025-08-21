import { prisma } from '@/lib/prisma';
import { SessionSet, SessionStatus, SetType, EffortLevel } from '@prisma/client';

// Devotion score pillar data
export interface DevotionPillars {
  EC: number; // Exercise Coverage (0-1)
  SC: number; // Set Completion (0-1)
  RF: number; // Rep Fidelity (0-1)
  LF?: number; // Load Fidelity (0-1, optional for bodyweight sessions)
}

// Deviation explanation for "Why this score?" sheet
export interface DevotionDeviation {
  type: 'missed_sets' | 'rep_variance' | 'load_variance' | 'missed_exercise';
  exerciseName: string;
  description: string; // e.g., "Missed 1 set on Жим платформи"
  impact: number; // How much this affected the score (0-1)
}

export interface SessionWithDetails {
  id: string;
  userId: string;
  workoutId: string | null;
  date: Date;
  status: SessionStatus;
  devotionScore: number | null; // 0-100 Commitment & Devotion Score
  devotionGrade: string | null; // "Dialed in", "On plan", "Loose", "Off plan"
  devotionPillars: DevotionPillars | null; // Pillar scores for visualization
  devotionDeviations: DevotionDeviation[] | null; // Top 3 deviations
  createdAt: Date;
  updatedAt: Date;
  sessionExercises: {
    id: string;
    sessionId: string;
    exerciseId: string;
    order: number;
    notes: string | null;
    exercise: {
      id: string;
      name: string;
    };
    sessionSets: {
      id: string;
      sessionExerciseId: string;
      type: SetType;
      load: number;
      reps: number;
      completed: boolean;
      order: number;
      notes: string | null;
    }[];
  }[];
  workout?: {
    id: string;
    title: string;
  } | null;
}

export interface CreateSessionData {
  workoutId: string;
  userId: string;
}

export interface UpdateSetData {
  setId: string;
  load?: number;
  reps?: number;
  completed?: boolean;
  notes?: string;
}

export interface BatchSetOperation {
  setId?: string;
  operation: 'update' | 'complete' | 'create' | 'delete';
  sessionExerciseId?: string;
  data?: {
    type?: SetType;
    load?: number;
    reps?: number;
    completed?: boolean;
    order?: number;
    notes?: string;
  };
}

export interface SessionSealData {
  effort: EffortLevel;
  vibeLine: string;
  note?: string;
}

export class SessionService {
  /**
   * Create a new session from a workout template
   */
  static async createSession(data: CreateSessionData): Promise<SessionWithDetails> {
    const { workoutId, userId } = data;

    // Check for recent duplicate sessions (within last 10 seconds) to prevent double-creation
    const recentSession = await prisma.session.findFirst({
      where: {
        userId,
        workoutId,
        createdAt: {
          gte: new Date(Date.now() - 10000) // Within last 10 seconds
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentSession) {
      console.log(`Preventing duplicate session creation for user ${userId}, workout ${workoutId}`);
      // Return the existing recent session instead of creating a duplicate
      const existingSession = await this.getSession(recentSession.id, userId);
      if (existingSession) {
        return existingSession;
      }
    }

    // First, get the workout with its exercises and sets
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        workoutItems: {
          include: {
            exercise: true,
            workoutItemSets: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!workout) {
      throw new Error(`Workout with id ${workoutId} not found`);
    }

    // Create the session and all related data in a transaction with increased timeout
    const session = await prisma.$transaction(async (tx) => {
      // Create the session
      const newSession = await tx.session.create({
        data: {
          userId,
          workoutId,
          status: SessionStatus.ACTIVE,
        }
      });

      // Batch create session exercises and sets for better performance
      const sessionExercisesData = workout.workoutItems.map(workoutItem => ({
        sessionId: newSession.id,
        exerciseId: workoutItem.exerciseId,
        order: workoutItem.order,
        notes: workoutItem.notes,
      }));

      // Create all session exercises at once
      const createdExercises = await Promise.all(
        sessionExercisesData.map(data => tx.sessionExercise.create({ data }))
      );

      // Prepare all session sets data
      const sessionSetsData = [];
      for (let i = 0; i < workout.workoutItems.length; i++) {
        const workoutItem = workout.workoutItems[i];
        const sessionExercise = createdExercises[i];
        
        for (const workoutSet of workoutItem.workoutItemSets) {
          sessionSetsData.push({
            sessionExerciseId: sessionExercise.id,
            type: workoutSet.type,
            load: workoutSet.targetLoad,
            reps: workoutSet.targetReps,
            completed: false,
            order: workoutSet.order,
            notes: workoutSet.notes,
          });
        }
      }

      // Create all session sets at once
      if (sessionSetsData.length > 0) {
        await Promise.all(
          sessionSetsData.map(data => tx.sessionSet.create({ data }))
        );
      }

      // Return the complete session with all related data
      return await tx.session.findUnique({
        where: { id: newSession.id },
        include: {
          sessionExercises: {
            include: {
              exercise: {
                select: { id: true, name: true }
              },
              sessionSets: {
                orderBy: { order: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          },
          workout: {
            select: { id: true, title: true }
          }
        }
      });
    }, {
      maxWait: 10000, // Maximum wait time to acquire a transaction: 10 seconds
      timeout: 30000, // Maximum duration of the transaction: 30 seconds
    });

    if (!session) {
      throw new Error('Failed to create session');
    }

    // Convert Prisma types to match our interface
    return {
      ...session,

      sessionExercises: session.sessionExercises.map(exercise => ({
        ...exercise,
        sessionSets: exercise.sessionSets.map(set => ({
          ...set,
          load: Number(set.load)
        }))
      }))
    } as SessionWithDetails;
  }

  /**
   * Get a session with all its details
   */
  static async getSession(sessionId: string, userId: string): Promise<SessionWithDetails | null> {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId, // Ensure user can only access their own sessions
      },
      include: {
        sessionExercises: {
          include: {
            exercise: {
              select: { id: true, name: true }
            },
            sessionSets: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        workout: {
          select: { id: true, title: true }
        }
      }
    });

    if (!session) {
      return null;
    }

    // Convert Prisma types to match our interface
    return {
      ...session,
      devotionScore: session.devotionScore,
      devotionGrade: session.devotionGrade,
      devotionPillars: session.devotionPillars ? JSON.parse(JSON.stringify(session.devotionPillars)) : null,
      devotionDeviations: session.devotionDeviations ? JSON.parse(JSON.stringify(session.devotionDeviations)) : null,
      sessionExercises: session.sessionExercises.map(exercise => ({
        ...exercise,
        sessionSets: exercise.sessionSets.map(set => ({
          ...set,
          load: Number(set.load)
        }))
      }))
    } as SessionWithDetails;
  }

  /**
   * Batch update multiple sets in a session
   */
  static async batchUpdateSets(
    sessionId: string, 
    userId: string, 
    operations: BatchSetOperation[]
  ): Promise<SessionWithDetails> {
    // Verify user owns the session
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new Error('Session not found or access denied');
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new Error('Cannot update completed session');
    }

    await prisma.$transaction(async (tx) => {
      for (const operation of operations) {
        switch (operation.operation) {
          case 'update':
            if (!operation.setId) throw new Error('Set ID required for update operation');
            if (!operation.data) throw new Error('Data required for update operation');
            await tx.sessionSet.update({
              where: { id: operation.setId },
              data: operation.data
            });
            break;

          case 'complete':
            if (!operation.setId) throw new Error('Set ID required for complete operation');
            await tx.sessionSet.update({
              where: { id: operation.setId },
              data: { completed: true, ...(operation.data || {}) }
            });
            break;

          case 'create':
            if (!operation.sessionExerciseId) throw new Error('Session exercise ID required for create operation');
            await tx.sessionSet.create({
              data: {
                sessionExerciseId: operation.sessionExerciseId,
                type: operation.data?.type || SetType.NORMAL,
                load: operation.data?.load || 0,
                reps: operation.data?.reps || 0,
                completed: operation.data?.completed || false,
                order: operation.data?.order || 0,
                notes: operation.data?.notes,
              }
            });
            break;

          case 'delete':
            if (!operation.setId) throw new Error('Set ID required for delete operation');
            await tx.sessionSet.delete({
              where: { id: operation.setId }
            });
            break;
        }
      }
    }, {
      maxWait: 5000, // Maximum wait time: 5 seconds
      timeout: 15000, // Maximum duration: 15 seconds
    });

    // Return updated session
    const updatedSession = await this.getSession(sessionId, userId);
    if (!updatedSession) {
      throw new Error('Failed to retrieve updated session');
    }

    return updatedSession;
  }

  /**
   * Finish a session (devotion score calculation will be handled separately)
   */
  static async finishSession(sessionId: string, userId: string): Promise<SessionWithDetails> {
    const session = await this.getSession(sessionId, userId);
    
    if (!session) {
      throw new Error('Session not found or access denied');
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new Error('Session is already finished');
    }

    // Simply mark session as finished - devotion scoring will be handled by DevotionScoringService
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.FINISHED,
      },
      include: {
        sessionExercises: {
          include: {
            exercise: {
              select: { id: true, name: true }
            },
            sessionSets: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        workout: {
          select: { id: true, title: true }
        }
      }
    });

    // Convert Prisma types to match our interface
    return {
      ...updatedSession,
      devotionScore: updatedSession.devotionScore,
      devotionGrade: updatedSession.devotionGrade,
      devotionPillars: updatedSession.devotionPillars ? JSON.parse(JSON.stringify(updatedSession.devotionPillars)) : null,
      devotionDeviations: updatedSession.devotionDeviations ? JSON.parse(JSON.stringify(updatedSession.devotionDeviations)) : null,
      sessionExercises: updatedSession.sessionExercises.map(exercise => ({
        ...exercise,
        sessionSets: exercise.sessionSets.map(set => ({
          ...set,
          load: Number(set.load)
        }))
      }))
    } as SessionWithDetails;
  }

  /**
   * Create a session seal (post-workout reflection)
   */
  static async createSessionSeal(
    sessionId: string, 
    userId: string, 
    sealData: SessionSealData
  ): Promise<void> {
    // Verify user owns the session and it's finished
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId, status: SessionStatus.FINISHED }
    });

    if (!session) {
      throw new Error('Session not found, access denied, or session not finished');
    }

    // Create or update session seal
    await prisma.sessionSeal.upsert({
      where: { sessionId },
      update: sealData,
      create: {
        sessionId,
        ...sealData
      }
    });
  }

  /**
   * Get user's session history
   */
  static async getUserSessions(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<SessionWithDetails[]> {
    const sessions = await prisma.session.findMany({
      where: { userId },
      include: {
        sessionExercises: {
          include: {
            exercise: {
              select: { id: true, name: true }
            },
            sessionSets: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        workout: {
          select: { id: true, title: true }
        }
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset
    });

    // Convert Prisma types to match our interface
    return sessions.map(session => ({
      ...session,

      sessionExercises: session.sessionExercises.map(exercise => ({
        ...exercise,
        sessionSets: exercise.sessionSets.map(set => ({
          ...set,
          load: Number(set.load)
        }))
      }))
    })) as SessionWithDetails[];
  }

  /**
   * Add a new set to a session exercise
   */
  static async addSet(
    sessionId: string,
    userId: string,
    sessionExerciseId: string,
    setData: {
      type?: SetType;
      load: number;
      reps: number;
      notes?: string;
    }
  ): Promise<SessionSet> {
    // Verify user owns the session
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId, status: SessionStatus.ACTIVE }
    });

    if (!session) {
      throw new Error('Session not found, access denied, or session not active');
    }

    // Get current max order for this exercise
    const maxOrder = await prisma.sessionSet.findFirst({
      where: { sessionExerciseId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const newOrder = (maxOrder?.order || 0) + 1;

    const newSet = await prisma.sessionSet.create({
      data: {
        sessionExerciseId,
        type: setData.type || SetType.NORMAL,
        load: setData.load,
        reps: setData.reps,
        completed: false,
        order: newOrder,
        notes: setData.notes,
      }
    });

    return newSet;
  }

  /**
   * Get previous session data for the same workout and exercise
   */
  static async getPreviousSessionData(
    userId: string, 
    workoutId: string, 
    exerciseId: string,
    currentSessionId?: string
  ): Promise<{ load: number; reps: number }[] | null> {
    // Find the most recent finished session for this workout (excluding current session if provided)
    const previousSession = await prisma.session.findFirst({
      where: {
        userId,
        workoutId,
        status: 'FINISHED',
        ...(currentSessionId && { id: { not: currentSessionId } })
      },
      include: {
        sessionExercises: {
          where: { exerciseId },
          include: {
            sessionSets: {
              where: { completed: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    if (!previousSession || previousSession.sessionExercises.length === 0) {
      return null;
    }

    // Get the completed sets from the previous session
    const previousSets = previousSession.sessionExercises[0].sessionSets.map(set => ({
      load: Number(set.load),
      reps: set.reps
    }));

    return previousSets.length > 0 ? previousSets : null;
  }

  /**
   * Delete a session and all its related data
   */
  static async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      // Verify user owns the session
      const session = await prisma.session.findFirst({
        where: { id: sessionId, userId }
      });

      if (!session) {
        throw new Error('Session not found or access denied');
      }

      // Delete session and all related data (cascade will handle the rest)
      await prisma.session.delete({
        where: { id: sessionId }
      });

      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }
}

