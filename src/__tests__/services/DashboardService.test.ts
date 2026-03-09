// Mock dependencies before imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    session: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    workout: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  getCurrentUserId: jest.fn(() => 'test-user-123'),
}))

jest.mock('@/services/FoxLevelService', () => ({
  FoxLevelService: {
    ensureEvaluated: jest.fn(),
    computeFormScore: jest.fn(),
  },
}))

// Mock Prisma enums
jest.mock('@prisma/client', () => ({
  ProgressionState: {
    SLIM: 'SLIM',
    FIT: 'FIT',
    STRONG: 'STRONG',
    FIERY: 'FIERY',
  },
  SessionStatus: {
    ACTIVE: 'ACTIVE',
    FINISHED: 'FINISHED',
  },
  WorkoutStatus: {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    ARCHIVED: 'ARCHIVED',
  },
}))

import { DashboardService } from '@/services/DashboardService'
import { prisma } from '@/lib/prisma'
import { FoxLevelService } from '@/services/FoxLevelService'

// Local enum references
const ProgressionState = {
  SLIM: 'SLIM' as const,
  FIT: 'FIT' as const,
  STRONG: 'STRONG' as const,
  FIERY: 'FIERY' as const,
}

const SessionStatus = {
  ACTIVE: 'ACTIVE' as const,
  FINISHED: 'FINISHED' as const,
}

describe('DashboardService', () => {
  describe('getDashboardData', () => {
    const mockUser = {
      id: 'test-user-123',
      weeklyGoal: 2,
      progressionState: ProgressionState.SLIM,
      foxLevel: ProgressionState.SLIM,
      foxFormScore: 0,
      foxLastEvalAt: new Date(),
    }

    beforeEach(() => {
      jest.clearAllMocks()
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.workout.findMany as jest.Mock).mockResolvedValue([])
      ;(FoxLevelService.ensureEvaluated as jest.Mock).mockResolvedValue({
        level: ProgressionState.SLIM,
        formScore: 0,
      })
      ;(FoxLevelService.computeFormScore as jest.Mock).mockResolvedValue({
        attendance: 0,
        quality: 0,
        consistency: 0,
        total: 0,
      })
    })

    describe('Fox level from FoxLevelService', () => {
      it('should read fox level from ensureEvaluated', async () => {
        ;(prisma.session.findMany as jest.Mock).mockResolvedValue([])
        ;(FoxLevelService.ensureEvaluated as jest.Mock).mockResolvedValue({
          level: ProgressionState.FIT,
          formScore: 55,
        })

        const result = await DashboardService.getDashboardData()

        expect(FoxLevelService.ensureEvaluated).toHaveBeenCalledWith('test-user-123')
        expect(result.foxState.state).toBe(ProgressionState.FIT)
        expect(result.foxState.formScore).toBe(55)
      })

      it('should return SLIM for new user with no sessions', async () => {
        ;(prisma.session.findMany as jest.Mock).mockResolvedValue([])

        const result = await DashboardService.getDashboardData()

        expect(result.foxState.state).toBe(ProgressionState.SLIM)
        expect(result.foxState.formScore).toBe(0)
        expect(result.foxState.hasNoSessions).toBe(true)
      })

      it('should show FIERY when FoxLevelService returns FIERY', async () => {
        ;(prisma.session.findMany as jest.Mock).mockResolvedValue([])
        ;(FoxLevelService.ensureEvaluated as jest.Mock).mockResolvedValue({
          level: ProgressionState.FIERY,
          formScore: 92,
        })

        const result = await DashboardService.getDashboardData()

        expect(result.foxState.state).toBe(ProgressionState.FIERY)
        expect(result.foxState.formScore).toBe(92)
      })

      it('should show timePeriod as "Last 6 weeks"', async () => {
        ;(prisma.session.findMany as jest.Mock).mockResolvedValue([])

        const result = await DashboardService.getDashboardData()

        expect(result.foxState.timePeriod).toBe('Last 6 weeks')
      })

      it('should include formScoreBreakdown from computeFormScore', async () => {
        ;(prisma.session.findMany as jest.Mock).mockResolvedValue([])
        ;(FoxLevelService.computeFormScore as jest.Mock).mockResolvedValue({
          attendance: 50,
          quality: 80,
          consistency: 33,
          total: 57,
        })

        const result = await DashboardService.getDashboardData()

        expect(FoxLevelService.computeFormScore).toHaveBeenCalledWith('test-user-123')
        expect(result.foxState.formScoreBreakdown).toEqual({
          attendance: 50,
          quality: 80,
          consistency: 33,
        })
      })
    })

    describe('Week progress calculation', () => {
      it('should correctly calculate completed this week', async () => {
        ;(prisma.session.findMany as jest.Mock)
          .mockResolvedValueOnce([]) // Current month devotion sessions
          .mockResolvedValueOnce([]) // Previous month devotion sessions
          .mockResolvedValueOnce([ // This week's sessions
            { id: '1', status: SessionStatus.FINISHED },
            { id: '2', status: SessionStatus.FINISHED },
          ])

        const result = await DashboardService.getDashboardData()

        expect(result.weekProgress.completed).toBe(2)
        expect(result.weekProgress.planned).toBe(2)
        expect(result.weekProgress.isComplete).toBe(true)
      })

      it('should mark week as incomplete if goal not met', async () => {
        ;(prisma.session.findMany as jest.Mock)
          .mockResolvedValueOnce([]) // Current month devotion sessions
          .mockResolvedValueOnce([]) // Previous month devotion sessions
          .mockResolvedValueOnce([ // This week's sessions
            { id: '1', status: SessionStatus.FINISHED },
          ])

        const result = await DashboardService.getDashboardData()

        expect(result.weekProgress.completed).toBe(1)
        expect(result.weekProgress.planned).toBe(2)
        expect(result.weekProgress.isComplete).toBe(false)
      })
    })

    describe('Next workout recommendation', () => {
      it('should return next workout if week not complete', async () => {
        const mockWorkout = {
          id: 'workout-1',
          title: 'Upper Body Strength',
          workoutItems: [
            { workoutItemSets: [{}, {}, {}] }, // 3 sets
            { workoutItemSets: [{}, {}] }, // 2 sets
          ],
        }

        ;(prisma.session.findMany as jest.Mock)
          .mockResolvedValueOnce([]) // Current month devotion sessions
          .mockResolvedValueOnce([]) // Previous month devotion sessions
          .mockResolvedValueOnce([]) // This week: 0 sessions

        ;(prisma.workout.findMany as jest.Mock).mockResolvedValue([mockWorkout])

        const result = await DashboardService.getDashboardData()

        expect(result.nextWorkout).toBeDefined()
        expect(result.nextWorkout?.title).toBe('Upper Body Strength')
        expect(result.nextWorkout?.exerciseCount).toBe(2)
        // Formula: totalSets * 3 + (exerciseCount - 1) = 5 * 3 + 1 = 16
        expect(result.nextWorkout?.estimatedDuration).toBe(16)
      })

      it('should return null if no active workouts exist', async () => {
        ;(prisma.session.findMany as jest.Mock)
          .mockResolvedValueOnce([]) // Current month devotion sessions
          .mockResolvedValueOnce([]) // Previous month devotion sessions
          .mockResolvedValueOnce([]) // This week: 0 sessions

        ;(prisma.workout.findMany as jest.Mock).mockResolvedValue([])

        const result = await DashboardService.getDashboardData()

        expect(result.nextWorkout).toBeNull()
      })
    })

    describe('Error handling', () => {
      it('should throw error if user not found', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

        await expect(DashboardService.getDashboardData()).rejects.toThrow('User not found')
      })
    })
  })
})
