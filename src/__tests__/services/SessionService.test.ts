// Mock Prisma before importing SessionService
jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    session: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sessionExercise: {
      create: jest.fn(),
    },
    sessionSet: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sessionSeal: {
      upsert: jest.fn(),
    },
    workout: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  }

  return { prisma: mockPrisma }
})

// Mock Prisma Client types and enums
jest.mock('@prisma/client', () => ({
  SessionStatus: {
    ACTIVE: 'ACTIVE',
    FINISHED: 'FINISHED',
  },
  SetType: {
    NORMAL: 'NORMAL',
    WARMUP: 'WARMUP',
    DROPSET: 'DROPSET',
  },
  EffortLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  },
}))

import { SessionService, CreateSessionData, BatchSetOperation, SessionSealData } from '@/services/SessionService'
import { prisma } from '@/lib/prisma'

// Import our mock enums
const SessionStatus = { ACTIVE: 'ACTIVE' as const, FINISHED: 'FINISHED' as const }
const SetType = { NORMAL: 'NORMAL' as const, WARMUP: 'WARMUP' as const, DROPSET: 'DROPSET' as const }
const EffortLevel = { LOW: 'LOW' as const, MEDIUM: 'MEDIUM' as const, HIGH: 'HIGH' as const }

describe('SessionService', () => {
  const mockUserId = 'user-123'
  const mockWorkoutId = 'workout-456'
  const mockSessionId = 'session-789'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createSession', () => {
    it('should create a new session from workout template', async () => {
      const mockWorkout = {
        id: mockWorkoutId,
        title: 'Test Workout',
        workoutItems: [
          {
            id: 'wi-1',
            exerciseId: 'ex-1',
            order: 0,
            notes: null,
            exercise: { id: 'ex-1', name: 'Bench Press' },
            workoutItemSets: [
              { id: 'wis-1', type: SetType.NORMAL, targetLoad: 100, targetReps: 10, order: 0, notes: null },
              { id: 'wis-2', type: SetType.NORMAL, targetLoad: 100, targetReps: 10, order: 1, notes: null },
            ],
          },
        ],
      }

      const mockCreatedSession = {
        id: mockSessionId,
        userId: mockUserId,
        workoutId: mockWorkoutId,
        status: SessionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionExercises: [
          {
            id: 'se-1',
            sessionId: mockSessionId,
            exerciseId: 'ex-1',
            order: 0,
            notes: null,
            exercise: { id: 'ex-1', name: 'Bench Press' },
            sessionSets: [
              {
                id: 'ss-1',
                sessionExerciseId: 'se-1',
                type: SetType.NORMAL,
                load: 100,
                reps: 10,
                completed: false,
                order: 0,
                notes: null,
              },
              {
                id: 'ss-2',
                sessionExerciseId: 'se-1',
                type: SetType.NORMAL,
                load: 100,
                reps: 10,
                completed: false,
                order: 1,
                notes: null,
              },
            ],
          },
        ],
        workout: { id: mockWorkoutId, title: 'Test Workout' },
      }

      // Mock no recent duplicate session
      ;(prisma.session.findFirst as jest.Mock).mockResolvedValue(null)

      // Mock workout lookup
      ;(prisma.workout.findUnique as jest.Mock).mockResolvedValue(mockWorkout)

      // Mock transaction
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma)
      })

      // Mock session creation within transaction
      ;(prisma.session.create as jest.Mock).mockResolvedValue({
        id: mockSessionId,
        userId: mockUserId,
        workoutId: mockWorkoutId,
        status: SessionStatus.ACTIVE,
      })

      // Mock exercise creation
      ;(prisma.sessionExercise.create as jest.Mock).mockResolvedValue({
        id: 'se-1',
        sessionId: mockSessionId,
        exerciseId: 'ex-1',
        order: 0,
      })

      // Mock set creation
      ;(prisma.sessionSet.create as jest.Mock).mockResolvedValue({})

      // Mock session retrieval at end of transaction
      ;(prisma.session.findUnique as jest.Mock).mockResolvedValue(mockCreatedSession)

      const data: CreateSessionData = {
        workoutId: mockWorkoutId,
        userId: mockUserId,
      }

      const result = await SessionService.createSession(data)

      expect(result).toBeDefined()
      expect(result.id).toBe(mockSessionId)
      expect(result.status).toBe(SessionStatus.ACTIVE)
      expect(result.sessionExercises).toHaveLength(1)
      expect(result.sessionExercises[0].sessionSets).toHaveLength(2)

      // Verify duplicate check was called
      expect(prisma.session.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            workoutId: mockWorkoutId,
          }),
        })
      )
    })

    it('should prevent duplicate session creation within 10 seconds', async () => {
      const recentSession = {
        id: 'recent-session-id',
        userId: mockUserId,
        workoutId: mockWorkoutId,
        status: SessionStatus.ACTIVE,
        createdAt: new Date(Date.now() - 5000), // 5 seconds ago
      }

      const mockExistingSession = {
        id: 'recent-session-id',
        userId: mockUserId,
        workoutId: mockWorkoutId,
        status: SessionStatus.ACTIVE,
        sessionExercises: [],
        workout: { id: mockWorkoutId, title: 'Test Workout' },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock finding recent duplicate
      ;(prisma.session.findFirst as jest.Mock)
        .mockResolvedValueOnce(recentSession) // First call finds duplicate
        .mockResolvedValueOnce(mockExistingSession) // Second call in getSession

      const data: CreateSessionData = {
        workoutId: mockWorkoutId,
        userId: mockUserId,
      }

      const result = await SessionService.createSession(data)

      // Should return existing session instead of creating new one
      expect(result.id).toBe('recent-session-id')

      // Workout lookup should NOT have been called
      expect(prisma.workout.findUnique).not.toHaveBeenCalled()

      // Transaction should NOT have been called
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should throw error if workout not found', async () => {
      // No recent duplicate
      ;(prisma.session.findFirst as jest.Mock).mockResolvedValue(null)

      // Workout not found
      ;(prisma.workout.findUnique as jest.Mock).mockResolvedValue(null)

      const data: CreateSessionData = {
        workoutId: 'non-existent-workout',
        userId: mockUserId,
      }

      await expect(SessionService.createSession(data)).rejects.toThrow(
        'Workout with id non-existent-workout not found'
      )
    })
  })

  describe('getSession', () => {
    it('should return session with all details for authorized user', async () => {
      const mockSession = {
        id: mockSessionId,
        userId: mockUserId,
        workoutId: mockWorkoutId,
        status: SessionStatus.ACTIVE,
        devotionScore: null,
        devotionGrade: null,
        devotionPillars: null,
        devotionDeviations: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionExercises: [],
        workout: { id: mockWorkoutId, title: 'Test Workout' },
        sessionSeal: null,
      }

      ;(prisma.session.findFirst as jest.Mock).mockResolvedValue(mockSession)

      const result = await SessionService.getSession(mockSessionId, mockUserId)

      expect(result).toBeDefined()
      expect(result?.id).toBe(mockSessionId)
      expect(result?.userId).toBe(mockUserId)

      // Verify authorization check
      expect(prisma.session.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: mockSessionId,
            userId: mockUserId, // Must check userId
          },
        })
      )
    })

    it('should return null for unauthorized user', async () => {
      ;(prisma.session.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await SessionService.getSession(mockSessionId, 'different-user')

      expect(result).toBeNull()
    })

    it('should return null for non-existent session', async () => {
      ;(prisma.session.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await SessionService.getSession('non-existent-session', mockUserId)

      expect(result).toBeNull()
    })
  })

  describe('batchUpdateSets', () => {
    beforeEach(() => {
      // Mock session ownership verification
      ;(prisma.session.findFirst as jest.Mock).mockResolvedValue({
        id: mockSessionId,
        userId: mockUserId,
        status: SessionStatus.ACTIVE,
      })

      // Mock transaction
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma)
      })

      // Mock getSession call at the end
      ;(prisma.session.findFirst as jest.Mock).mockResolvedValue({
        id: mockSessionId,
        userId: mockUserId,
        status: SessionStatus.ACTIVE,
        sessionExercises: [],
        workout: { id: mockWorkoutId, title: 'Test' },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    it('should handle update operation', async () => {
      const operations: BatchSetOperation[] = [
        {
          operation: 'update',
          setId: 'set-1',
          data: { load: 150, reps: 12 },
        },
      ]

      await SessionService.batchUpdateSets(mockSessionId, mockUserId, operations)

      expect(prisma.sessionSet.update).toHaveBeenCalledWith({
        where: { id: 'set-1' },
        data: { load: 150, reps: 12 },
      })
    })

    it('should handle complete operation', async () => {
      const operations: BatchSetOperation[] = [
        {
          operation: 'complete',
          setId: 'set-1',
          data: { load: 100, reps: 10 },
        },
      ]

      await SessionService.batchUpdateSets(mockSessionId, mockUserId, operations)

      expect(prisma.sessionSet.update).toHaveBeenCalledWith({
        where: { id: 'set-1' },
        data: { completed: true, load: 100, reps: 10 },
      })
    })

    it('should handle create operation', async () => {
      const operations: BatchSetOperation[] = [
        {
          operation: 'create',
          sessionExerciseId: 'se-1',
          data: {
            type: SetType.NORMAL,
            load: 100,
            reps: 10,
            completed: false,
            order: 2,
          },
        },
      ]

      await SessionService.batchUpdateSets(mockSessionId, mockUserId, operations)

      expect(prisma.sessionSet.create).toHaveBeenCalledWith({
        data: {
          sessionExerciseId: 'se-1',
          type: SetType.NORMAL,
          load: 100,
          reps: 10,
          completed: false,
          order: 2,
          notes: undefined,
        },
      })
    })

    it('should handle delete operation', async () => {
      const operations: BatchSetOperation[] = [
        {
          operation: 'delete',
          setId: 'set-1',
        },
      ]

      await SessionService.batchUpdateSets(mockSessionId, mockUserId, operations)

      expect(prisma.sessionSet.delete).toHaveBeenCalledWith({
        where: { id: 'set-1' },
      })
    })

    it('should handle mixed operations in batch', async () => {
      const operations: BatchSetOperation[] = [
        { operation: 'update', setId: 'set-1', data: { load: 150 } },
        { operation: 'complete', setId: 'set-2' },
        { operation: 'create', sessionExerciseId: 'se-1', data: { type: SetType.NORMAL, load: 100, reps: 10, order: 3 } },
        { operation: 'delete', setId: 'set-3' },
      ]

      await SessionService.batchUpdateSets(mockSessionId, mockUserId, operations)

      expect(prisma.sessionSet.update).toHaveBeenCalledTimes(2) // update + complete
      expect(prisma.sessionSet.create).toHaveBeenCalledTimes(1)
      expect(prisma.sessionSet.delete).toHaveBeenCalledTimes(1)
    })

    it('should throw error if session not found', async () => {
      ;(prisma.session.findFirst as jest.Mock).mockResolvedValueOnce(null)

      const operations: BatchSetOperation[] = [
        { operation: 'update', setId: 'set-1', data: { load: 150 } },
      ]

      await expect(
        SessionService.batchUpdateSets(mockSessionId, 'wrong-user', operations)
      ).rejects.toThrow('Session not found or access denied')
    })

    it('should throw error if session is not ACTIVE', async () => {
      ;(prisma.session.findFirst as jest.Mock).mockResolvedValueOnce({
        id: mockSessionId,
        userId: mockUserId,
        status: SessionStatus.FINISHED, // Already finished
      })

      const operations: BatchSetOperation[] = [
        { operation: 'update', setId: 'set-1', data: { load: 150 } },
      ]

      await expect(
        SessionService.batchUpdateSets(mockSessionId, mockUserId, operations)
      ).rejects.toThrow('Cannot update completed session')
    })

    it('should throw error for update operation without setId', async () => {
      const operations: BatchSetOperation[] = [
        { operation: 'update', data: { load: 150 } }, // Missing setId
      ]

      await expect(
        SessionService.batchUpdateSets(mockSessionId, mockUserId, operations)
      ).rejects.toThrow('Set ID required for update operation')
    })

    it('should throw error for create operation without sessionExerciseId', async () => {
      const operations: BatchSetOperation[] = [
        { operation: 'create', data: { load: 100 } }, // Missing sessionExerciseId
      ]

      await expect(
        SessionService.batchUpdateSets(mockSessionId, mockUserId, operations)
      ).rejects.toThrow('Session exercise ID required for create operation')
    })
  })

  describe('finishSession', () => {
    it('should mark session as FINISHED', async () => {
      const mockActiveSession = {
        id: mockSessionId,
        userId: mockUserId,
        status: SessionStatus.ACTIVE,
        sessionExercises: [],
        workout: { id: mockWorkoutId, title: 'Test' },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockFinishedSession = {
        ...mockActiveSession,
        status: SessionStatus.FINISHED,
      }

      // Mock getSession call
      ;(prisma.session.findFirst as jest.Mock).mockResolvedValueOnce(mockActiveSession)

      // Mock update
      ;(prisma.session.update as jest.Mock).mockResolvedValue(mockFinishedSession)

      const result = await SessionService.finishSession(mockSessionId, mockUserId)

      expect(result.status).toBe(SessionStatus.FINISHED)
      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockSessionId },
          data: { status: SessionStatus.FINISHED },
        })
      )
    })

    it('should throw error if session not found', async () => {
      ;(prisma.session.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(
        SessionService.finishSession(mockSessionId, 'wrong-user')
      ).rejects.toThrow('Session not found or access denied')
    })

    it('should throw error if session is already FINISHED', async () => {
      const mockFinishedSession = {
        id: mockSessionId,
        userId: mockUserId,
        status: SessionStatus.FINISHED,
        sessionExercises: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.session.findFirst as jest.Mock).mockResolvedValue(mockFinishedSession)

      await expect(
        SessionService.finishSession(mockSessionId, mockUserId)
      ).rejects.toThrow('Session is already finished')
    })
  })

  describe('createSessionSeal', () => {
    it('should create session seal for finished session', async () => {
      const mockFinishedSession = {
        id: mockSessionId,
        userId: mockUserId,
        status: SessionStatus.FINISHED,
      }

      ;(prisma.session.findFirst as jest.Mock).mockResolvedValue(mockFinishedSession)
      ;(prisma.sessionSeal.upsert as jest.Mock).mockResolvedValue({})

      const sealData: SessionSealData = {
        effort: EffortLevel.MEDIUM,
        vibeLine: 'Felt good today!',
        note: 'Great session',
      }

      await SessionService.createSessionSeal(mockSessionId, mockUserId, sealData)

      expect(prisma.sessionSeal.upsert).toHaveBeenCalledWith({
        where: { sessionId: mockSessionId },
        update: sealData,
        create: {
          sessionId: mockSessionId,
          ...sealData,
        },
      })
    })

    it('should throw error if session is not FINISHED', async () => {
      ;(prisma.session.findFirst as jest.Mock).mockResolvedValue(null)

      const sealData: SessionSealData = {
        effort: EffortLevel.MEDIUM,
        vibeLine: 'Felt good',
      }

      await expect(
        SessionService.createSessionSeal(mockSessionId, mockUserId, sealData)
      ).rejects.toThrow('Session not found, access denied, or session not finished')
    })

    it('should throw error for unauthorized user', async () => {
      ;(prisma.session.findFirst as jest.Mock).mockResolvedValue(null)

      const sealData: SessionSealData = {
        effort: EffortLevel.HIGH,
        vibeLine: 'Good vibes',
      }

      await expect(
        SessionService.createSessionSeal(mockSessionId, 'wrong-user', sealData)
      ).rejects.toThrow('Session not found, access denied, or session not finished')
    })
  })
})
