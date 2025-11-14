// Mock dependencies before imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    session: {
      findMany: jest.fn(),
    },
    workout: {
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  getCurrentUserId: jest.fn(() => 'test-user-123'),
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

const WorkoutStatus = {
  DRAFT: 'DRAFT' as const,
  ACTIVE: 'ACTIVE' as const,
  ARCHIVED: 'ARCHIVED' as const,
}

describe('DashboardService', () => {
  describe('calculateFoxState (via getDashboardData)', () => {
    const mockUser = {
      id: 'test-user-123',
      weeklyGoal: 2,
      progressionState: ProgressionState.SLIM,
    }

    beforeEach(() => {
      jest.clearAllMocks()
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.workout.findFirst as jest.Mock).mockResolvedValue(null)
    })

    describe('Zero completions', () => {
      it('should return SLIM for zero workouts', async () => {
        ;(prisma.session.findMany as jest.Mock).mockResolvedValue([])

        const result = await DashboardService.getDashboardData()

        expect(result.foxState.state).toBe(ProgressionState.SLIM)
        expect(result.foxState.devotionScore).toBeNull()
      })
    })

    describe('Completion percentage (without devotion modifiers)', () => {
      it('should return SLIM for < 50% completion (less than 4 sessions)', async () => {
        const sessions = Array(7).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: null,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // For weeklyGoal=2, totalPlanned=16, 7 sessions = 43.75% < 50%
        expect(result.foxState.state).toBe(ProgressionState.SLIM)
      })

      it('should return FIT for 50-75% completion', async () => {
        const sessions = Array(10).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: null,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // For weeklyGoal=2, totalPlanned=16, 10 sessions = 62.5%
        expect(result.foxState.state).toBe(ProgressionState.FIT)
      })

      it('should return STRONG for 75-100% completion', async () => {
        const sessions = Array(13).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: null,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // For weeklyGoal=2, totalPlanned=16, 13 sessions = 81.25%
        expect(result.foxState.state).toBe(ProgressionState.STRONG)
      })

      it('should return FIERY for >= 100% completion', async () => {
        const sessions = Array(16).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: null,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // For weeklyGoal=2, totalPlanned=16, 16 sessions = 100%
        expect(result.foxState.state).toBe(ProgressionState.FIERY)
      })
    })

    describe('Devotion score modifiers (after 4+ sessions)', () => {
      it('should PROMOTE from SLIM to FIT with high devotion (>=90)', async () => {
        const sessions = Array(4).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: 95, // High devotion
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // Base state would be SLIM (4/16 = 25%), but with devotion >=90, promotes to FIT
        expect(result.foxState.state).toBe(ProgressionState.FIT)
        expect(result.foxState.devotionScore).toBe(95)
      })

      it('should PROMOTE from FIT to STRONG with high devotion', async () => {
        const sessions = Array(10).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: 92,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // Base state would be FIT (10/16 = 62.5%), promotes to STRONG
        expect(result.foxState.state).toBe(ProgressionState.STRONG)
      })

      it('should PROMOTE from STRONG to FIERY with high devotion', async () => {
        const sessions = Array(13).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: 95,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // Base state would be STRONG (13/16 = 81%), promotes to FIERY
        expect(result.foxState.state).toBe(ProgressionState.FIERY)
      })

      it('should NOT promote FIERY (already max level)', async () => {
        const sessions = Array(16).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: 95,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // Already at FIERY, can't promote further
        expect(result.foxState.state).toBe(ProgressionState.FIERY)
      })

      it('should DEMOTE from FIT to SLIM with low devotion (<80)', async () => {
        const sessions = Array(10).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: 75,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // Base state would be FIT (10/16 = 62.5%), demotes to SLIM
        expect(result.foxState.state).toBe(ProgressionState.SLIM)
        expect(result.foxState.devotionScore).toBe(75)
      })

      it('should DEMOTE from STRONG to FIT with low devotion', async () => {
        const sessions = Array(13).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: 70,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // Base state would be STRONG (13/16 = 81%), demotes to FIT
        expect(result.foxState.state).toBe(ProgressionState.FIT)
      })

      it('should NOT demote FIERY with perfect completion (>=100% always FIERY)', async () => {
        const sessions = Array(17).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: 78,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // Special case: >= 100% completion is always FIERY (bypasses devotion modifiers)
        expect(result.foxState.state).toBe(ProgressionState.FIERY)
      })

      it('should NOT demote SLIM (already min level)', async () => {
        const sessions = Array(4).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: 75,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // Already at SLIM, can't demote further
        expect(result.foxState.state).toBe(ProgressionState.SLIM)
      })

      it('should NOT apply modifiers for devotion score between 80-89', async () => {
        const sessions = Array(10).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: 85, // Between 80-89
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // Base state is FIT (10/16 = 62.5%), no modifier applied
        expect(result.foxState.state).toBe(ProgressionState.FIT)
      })

      it('should NOT apply modifiers for less than 4 sessions', async () => {
        const sessions = Array(3).fill(null).map((_, i) => ({
          id: `session-${i}`,
          userId: mockUser.id,
          status: SessionStatus.FINISHED,
          devotionScore: 95, // High devotion, but not enough sessions
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        }))

        ;(prisma.session.findMany as jest.Mock).mockResolvedValue(sessions)

        const result = await DashboardService.getDashboardData()

        // Only 3 sessions, so devotion modifiers don't apply
        // Base state is SLIM (3/16 = 18.75%)
        expect(result.foxState.state).toBe(ProgressionState.SLIM)
      })
    })

    describe('Week progress calculation', () => {
      it('should correctly calculate completed this week', async () => {
        // Mock 8-week sessions and this week's sessions
        ;(prisma.session.findMany as jest.Mock)
          .mockResolvedValueOnce([]) // First call: 8-week sessions
          .mockResolvedValueOnce([ // Second call: This week's sessions
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
          .mockResolvedValueOnce([]) // First call: 8-week sessions
          .mockResolvedValueOnce([ // Second call: This week's sessions
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
          .mockResolvedValueOnce([]) // 8-week sessions
          .mockResolvedValueOnce([]) // This week: 0 sessions

        ;(prisma.workout.findFirst as jest.Mock).mockResolvedValue(mockWorkout)

        const result = await DashboardService.getDashboardData()

        expect(result.nextWorkout).toBeDefined()
        expect(result.nextWorkout?.title).toBe('Upper Body Strength')
        expect(result.nextWorkout?.exerciseCount).toBe(2)
        // Formula: totalSets * 3 + (exerciseCount - 1) = 5 * 3 + 1 = 16
        expect(result.nextWorkout?.estimatedDuration).toBe(16)
      })

      it('should return null if week is complete', async () => {
        jest.clearAllMocks() // Clear mocks to check workout.findFirst call

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.session.findMany as jest.Mock)
          .mockResolvedValueOnce([]) // 8-week sessions
          .mockResolvedValueOnce([ // This week: 2 sessions (goal met)
            { id: '1' },
            { id: '2' },
          ])

        const result = await DashboardService.getDashboardData()

        expect(result.nextWorkout).toBeNull()
        expect(result.weekProgress.isComplete).toBe(true)
        // Workout lookup should be skipped when week is complete
        expect(prisma.workout.findFirst).not.toHaveBeenCalled()
      })

      it('should return null if no active workouts exist', async () => {
        ;(prisma.session.findMany as jest.Mock)
          .mockResolvedValueOnce([]) // 8-week sessions
          .mockResolvedValueOnce([]) // This week: 0 sessions

        ;(prisma.workout.findFirst as jest.Mock).mockResolvedValue(null)

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
