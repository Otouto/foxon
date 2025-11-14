import { User, Workout, Session, WorkoutExercise, SessionExercise, SessionSet } from '@prisma/client'

// Mock User
export const mockUser: User = {
  id: 'test-user-123',
  clerkUserId: 'clerk_test_123',
  displayName: 'Test User',
  weeklyGoal: 3,
  progressionState: 'SLIM',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Mock Workout (Simple)
export const mockWorkoutSimple = {
  id: 'workout-simple-1',
  userId: mockUser.id,
  title: 'Basic Strength',
  description: 'Simple strength workout',
  status: 'ACTIVE' as const,
  estimatedDuration: 45,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Mock Workout Exercises
export const mockWorkoutExercises: WorkoutExercise[] = [
  {
    id: 'we-1',
    workoutId: mockWorkoutSimple.id,
    exerciseId: 'ex-bench-press',
    order: 0,
    blockId: null,
    blockOrder: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'we-2',
    workoutId: mockWorkoutSimple.id,
    exerciseId: 'ex-squat',
    order: 1,
    blockId: null,
    blockOrder: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

// Mock Exercises
export const mockExercises = [
  {
    id: 'ex-bench-press',
    name: 'Bench Press',
    muscleGroupId: 'mg-chest',
    equipmentId: 'eq-barbell',
    isBodyweight: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'ex-squat',
    name: 'Squat',
    muscleGroupId: 'mg-legs',
    equipmentId: 'eq-barbell',
    isBodyweight: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'ex-pushup',
    name: 'Push-up',
    muscleGroupId: 'mg-chest',
    equipmentId: 'eq-bodyweight',
    isBodyweight: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
]

// Mock Planned Sets
export const mockPlannedSets = [
  // Bench Press sets
  { id: 'ps-1', workoutExerciseId: 'we-1', order: 0, targetReps: 10, targetWeight: 135, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ps-2', workoutExerciseId: 'we-1', order: 1, targetReps: 10, targetWeight: 135, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ps-3', workoutExerciseId: 'we-1', order: 2, targetReps: 10, targetWeight: 135, createdAt: new Date(), updatedAt: new Date() },
  // Squat sets
  { id: 'ps-4', workoutExerciseId: 'we-2', order: 0, targetReps: 8, targetWeight: 185, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ps-5', workoutExerciseId: 'we-2', order: 1, targetReps: 8, targetWeight: 185, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ps-6', workoutExerciseId: 'we-2', order: 2, targetReps: 8, targetWeight: 185, createdAt: new Date(), updatedAt: new Date() },
]

// Mock Session
export const mockSession: Session = {
  id: 'session-1',
  userId: mockUser.id,
  workoutId: mockWorkoutSimple.id,
  status: 'ACTIVE',
  startedAt: new Date('2024-01-15T10:00:00Z'),
  completedAt: null,
  sealedAt: null,
  reflection: null,
  devotionScore: null,
  devotionGrade: null,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
}

// Mock Session Exercises
export const mockSessionExercises: SessionExercise[] = [
  {
    id: 'se-1',
    sessionId: mockSession.id,
    exerciseId: 'ex-bench-press',
    order: 0,
    blockId: null,
    blockOrder: null,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 'se-2',
    sessionId: mockSession.id,
    exerciseId: 'ex-squat',
    order: 1,
    blockId: null,
    blockOrder: null,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
]

// Mock Session Sets - Perfect Execution
export const mockSessionSetsPerfect: SessionSet[] = [
  // Bench Press - all complete, on target
  { id: 'ss-1', sessionExerciseId: 'se-1', order: 0, targetReps: 10, targetWeight: 135, actualReps: 10, actualWeight: 135, isComplete: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ss-2', sessionExerciseId: 'se-1', order: 1, targetReps: 10, targetWeight: 135, actualReps: 10, actualWeight: 135, isComplete: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ss-3', sessionExerciseId: 'se-1', order: 2, targetReps: 10, targetWeight: 135, actualReps: 10, actualWeight: 135, isComplete: true, createdAt: new Date(), updatedAt: new Date() },
  // Squat - all complete, on target
  { id: 'ss-4', sessionExerciseId: 'se-2', order: 0, targetReps: 8, targetWeight: 185, actualReps: 8, actualWeight: 185, isComplete: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ss-5', sessionExerciseId: 'se-2', order: 1, targetReps: 8, targetWeight: 185, actualReps: 8, actualWeight: 185, isComplete: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ss-6', sessionExerciseId: 'se-2', order: 2, targetReps: 8, targetWeight: 185, actualReps: 8, actualWeight: 185, isComplete: true, createdAt: new Date(), updatedAt: new Date() },
]

// Mock Session Sets - Imperfect Execution
export const mockSessionSetsImperfect: SessionSet[] = [
  // Bench Press - missed reps
  { id: 'ss-1', sessionExerciseId: 'se-1', order: 0, targetReps: 10, targetWeight: 135, actualReps: 10, actualWeight: 135, isComplete: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ss-2', sessionExerciseId: 'se-1', order: 1, targetReps: 10, targetWeight: 135, actualReps: 8, actualWeight: 135, isComplete: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ss-3', sessionExerciseId: 'se-1', order: 2, targetReps: 10, targetWeight: 135, actualReps: 7, actualWeight: 135, isComplete: true, createdAt: new Date(), updatedAt: new Date() },
  // Squat - one set missed
  { id: 'ss-4', sessionExerciseId: 'se-2', order: 0, targetReps: 8, targetWeight: 185, actualReps: 8, actualWeight: 185, isComplete: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ss-5', sessionExerciseId: 'se-2', order: 1, targetReps: 8, targetWeight: 185, actualReps: 8, actualWeight: 185, isComplete: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ss-6', sessionExerciseId: 'se-2', order: 2, targetReps: 8, targetWeight: 185, actualReps: null, actualWeight: null, isComplete: false, createdAt: new Date(), updatedAt: new Date() },
]

// Helper function to create a workout with exercises
export function createMockWorkoutWithExercises() {
  return {
    ...mockWorkoutSimple,
    WorkoutExercise: mockWorkoutExercises.map((we) => ({
      ...we,
      Exercise: mockExercises.find((e) => e.id === we.exerciseId),
      PlannedSet: mockPlannedSets.filter((ps) => ps.workoutExerciseId === we.id),
    })),
  }
}

// Helper function to create a session with exercises and sets
export function createMockSessionWithData(setType: 'perfect' | 'imperfect' = 'perfect') {
  const sets = setType === 'perfect' ? mockSessionSetsPerfect : mockSessionSetsImperfect

  return {
    ...mockSession,
    SessionExercise: mockSessionExercises.map((se) => ({
      ...se,
      Exercise: mockExercises.find((e) => e.id === se.exerciseId),
      SessionSet: sets.filter((ss) => ss.sessionExerciseId === se.id),
    })),
  }
}
