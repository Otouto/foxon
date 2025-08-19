// Mock User for testing without Clerk authentication
export const MOCK_USER = {
  id: 'user-dmytro-1',
  clerkUserId: 'mock-clerk-dmytro-123',
  displayName: 'Dmytro',
  weeklyGoal: 2,
  progressionState: 'FIT' as const
};

// Vocabulary interfaces matching new ERD structure
export interface MuscleGroup {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  description?: string;
  muscle_group_id?: string;
  equipment_id?: string;
  instructions?: string;
  created_at: string;
  updated_at: string;
  // Populated references for convenience
  muscle_group?: MuscleGroup;
  equipment?: Equipment;
}

// Legacy interfaces for backward compatibility
export interface WorkoutSet {
  reps: number;
  weight: number; // in kg
  notes?: string;
}

export interface Exercise {
  name: string;
  sets: WorkoutSet[];
  notes?: string;
  previousSession?: WorkoutSet[]; // Previous workout session data for comparison
}

export interface Workout {
  id: string;
  name: string;
  exercises: number;
  duration: number;
  description: string;
  exercises_list: Exercise[];
}

// Session interfaces to mimic database structure
export interface SessionSet {
  id: string;
  type: 'WARMUP' | 'NORMAL';
  load: number;
  reps: number;
  completed: boolean;
  order: number;
}

export interface SessionExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  order: number;
  notes?: string;
  sets: SessionSet[];
}

export interface Session {
  id: string;
  workout_id: string;
  workout_name: string;
  date: string;
  total_volume: number;
  total_sets: number;
  status: 'ACTIVE' | 'FINISHED';
  current_exercise_index: number;
  exercises: SessionExercise[];
  created_at: string;
  updated_at: string;
}

// Vocabulary seed data matching new ERD structure
const now = new Date().toISOString();

export const muscleGroupsSeed: Record<string, MuscleGroup> = {
  'legs': {
    id: 'legs',
    name: 'Ноги',
    description: 'Квадрицепси, біцепси стегна, сідниці, литки',
    created_at: now,
    updated_at: now
  },
  'chest': {
    id: 'chest',
    name: 'Груди',
    description: 'Великі та малі грудні м\'язи',
    created_at: now,
    updated_at: now
  },
  'back': {
    id: 'back',
    name: 'Спина',
    description: 'Широчайші, ромбовидні, трапеції',
    created_at: now,
    updated_at: now
  },
  'shoulders': {
    id: 'shoulders',
    name: 'Плечі',
    description: 'Дельтовидні м\'язи',
    created_at: now,
    updated_at: now
  },
  'arms': {
    id: 'arms',
    name: 'Руки',
    description: 'Біцепси, трицепси, передпліччя',
    created_at: now,
    updated_at: now
  },
  'core': {
    id: 'core',
    name: 'Прес',
    description: 'Основні м\'язи кору',
    created_at: now,
    updated_at: now
  }
};

export const equipmentSeed: Record<string, Equipment> = {
  'bodyweight': {
    id: 'bodyweight',
    name: 'Власна вага',
    description: 'Вправи без додаткового обладнання',
    created_at: now,
    updated_at: now
  },
  'dumbbells': {
    id: 'dumbbells',
    name: 'Гантелі',
    description: 'Розбірні або незмінні гантелі',
    created_at: now,
    updated_at: now
  },
  'barbell': {
    id: 'barbell',
    name: 'Штанга',
    description: 'Олімпійська або звичайна штанга',
    created_at: now,
    updated_at: now
  },
  'machine': {
    id: 'machine',
    name: 'Тренажер',
    description: 'Силові тренажери',
    created_at: now,
    updated_at: now
  },
  'kettlebell': {
    id: 'kettlebell',
    name: 'Гиря',
    description: 'Kettlebell вправи',
    created_at: now,
    updated_at: now
  },
  'cable': {
    id: 'cable',
    name: 'Канат',
    description: 'Канати для тяги',
    created_at: now,
    updated_at: now
  }
};

export const exercisesSeed: Record<string, ExerciseDefinition> = {
  'single-leg-squats': {
    id: 'single-leg-squats',
    name: 'Присідання на 1 нозі',
    description: 'Односторонні присідання для розвитку балансу та сили',
    muscle_group_id: 'legs',
    equipment_id: 'dumbbells',
    instructions: 'Тримайте гантелі в руках, виконуйте присідання на одній нозі. Фокус на балансі та контролі руху.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['legs'],
    equipment: equipmentSeed['dumbbells']
  },
  'leg-press': {
    id: 'leg-press',
    name: 'Жим платформи',
    description: 'Жим ногами в тренажері',
    muscle_group_id: 'legs',
    equipment_id: 'machine',
    instructions: 'Поступове збільшення ваги, контроль негативної фази.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['legs'],
    equipment: equipmentSeed['machine']
  },
  'chest-press': {
    id: 'chest-press',
    name: 'Жим на грудь',
    description: 'Жим грудей в тренажері',
    muscle_group_id: 'chest',
    equipment_id: 'machine',
    instructions: 'Контроль негативної фази руху.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['chest'],
    equipment: equipmentSeed['machine']
  },
  'horizontal-row': {
    id: 'horizontal-row',
    name: 'Горизонтальна тяга',
    description: 'Тяга в горизонтальному положенні',
    muscle_group_id: 'back',
    equipment_id: 'machine',
    instructions: 'Зведення лопаток в кінцевій точці.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['back'],
    equipment: equipmentSeed['machine']
  },
  'tricep-extension': {
    id: 'tricep-extension',
    name: 'Розгинання на трицепс з канатом',
    description: 'Ізольована вправа на трицепс',
    muscle_group_id: 'arms',
    equipment_id: 'cable',
    instructions: 'Повна амплітуда руху.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['arms'],
    equipment: equipmentSeed['cable']
  },
  'barbell-bicep-curl': {
    id: 'barbell-bicep-curl',
    name: 'Штанга на біцепс',
    description: 'Базова вправа на біцепс',
    muscle_group_id: 'arms',
    equipment_id: 'barbell',
    instructions: 'Контрольований темп виконання.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['arms'],
    equipment: equipmentSeed['barbell']
  },
  'sumo-squat-kettlebell': {
    id: 'sumo-squat-kettlebell',
    name: 'Присідання сумо з гирею',
    description: 'Присідання з широкою постановкою ніг',
    muscle_group_id: 'legs',
    equipment_id: 'kettlebell',
    instructions: 'Широка постановка ніг, гиря між ніг.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['legs'],
    equipment: equipmentSeed['kettlebell']
  },
  'pull-ups': {
    id: 'pull-ups',
    name: 'Підтягування',
    description: 'Підтягування на перекладині',
    muscle_group_id: 'back',
    equipment_id: 'bodyweight',
    instructions: 'До відмови в кожному підході.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['back'],
    equipment: equipmentSeed['bodyweight']
  },
  'push-ups': {
    id: 'push-ups',
    name: 'Віджимання класика',
    description: 'Класичні віджимання від підлоги',
    muscle_group_id: 'chest',
    equipment_id: 'bodyweight',
    instructions: 'Класичні віджимання, повна амплітуда.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['chest'],
    equipment: equipmentSeed['bodyweight']
  },
  'machine-row': {
    id: 'machine-row',
    name: 'Тяга в тренажері',
    description: 'Тяга сидячи в тренажері',
    muscle_group_id: 'back',
    equipment_id: 'machine',
    instructions: 'Поступове збільшення ваги.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['back'],
    equipment: equipmentSeed['machine']
  },
  'dumbbell-flyes': {
    id: 'dumbbell-flyes',
    name: 'Розводка гантелей - бабочка',
    description: 'Розводка гантелей для грудей',
    muscle_group_id: 'chest',
    equipment_id: 'dumbbells',
    instructions: 'Контроль в негативній фазі.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['chest'],
    equipment: equipmentSeed['dumbbells']
  },
  'rear-delt-flyes': {
    id: 'rear-delt-flyes',
    name: 'Задня дельта',
    description: 'Розводка для задньої дельти',
    muscle_group_id: 'shoulders',
    equipment_id: 'machine',
    instructions: 'Фокус на задню дельтовидну.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['shoulders'],
    equipment: equipmentSeed['machine']
  }
};

export const workoutSeedData: Record<string, Workout> = {
  '1': {
    id: '1',
    name: 'Силова 1',
    exercises: 6,
    duration: 60,
    description: 'Комплексна силова тренування з акцентом на ноги, груди та руки',
    exercises_list: [
      {
        name: 'Присідання на 1 нозі',
        sets: [
          { reps: 12, weight: 12, notes: 'по 6кг в кожній руці' },
          { reps: 12, weight: 12, notes: 'по 6кг в кожній руці' },
          { reps: 12, weight: 12, notes: 'по 6кг в кожній руці' },
          { reps: 12, weight: 12, notes: 'по 6кг в кожній руці' }
        ],
        previousSession: [
          { reps: 10, weight: 10 },
          { reps: 10, weight: 10 },
          { reps: 8, weight: 10 },
          { reps: 8, weight: 10 }
        ],
        notes: 'Фокус на балансі та контролі руху'
      },
      {
        name: 'Жим платформи',
        sets: [
          { reps: 10, weight: 75 },
          { reps: 10, weight: 75 },
          { reps: 10, weight: 100 },
          { reps: 10, weight: 100 }
        ],
        previousSession: [
          { reps: 12, weight: 70 },
          { reps: 10, weight: 70 },
          { reps: 8, weight: 90 },
          { reps: 8, weight: 90 }
        ],
        notes: 'Поступове збільшення ваги'
      },
      {
        name: 'Жим на грудь',
        sets: [
          { reps: 10, weight: 40 },
          { reps: 10, weight: 45 },
          { reps: 10, weight: 45 }
        ],
        previousSession: [
          { reps: 12, weight: 35 },
          { reps: 10, weight: 40 },
          { reps: 8, weight: 40 }
        ],
        notes: 'Контроль негативної фази'
      },
      {
        name: 'Горизонтальна тяга',
        sets: [
          { reps: 12, weight: 40 },
          { reps: 12, weight: 40 },
          { reps: 12, weight: 40 },
          { reps: 12, weight: 45 }
        ],
        previousSession: [
          { reps: 12, weight: 35 },
          { reps: 12, weight: 35 },
          { reps: 10, weight: 40 },
          { reps: 8, weight: 40 }
        ],
        notes: 'Зведення лопаток в кінцевій точці'
      },
      {
        name: 'Розгинання на трицепс з канатом',
        sets: [
          { reps: 10, weight: 20 },
          { reps: 10, weight: 20 },
          { reps: 10, weight: 20 }
        ],
        previousSession: [
          { reps: 12, weight: 17.5 },
          { reps: 10, weight: 17.5 },
          { reps: 8, weight: 20 }
        ],
        notes: 'Повна амплітуда руху'
      },
      {
        name: 'Штанга на біцепс',
        sets: [
          { reps: 10, weight: 15 },
          { reps: 10, weight: 20 },
          { reps: 10, weight: 20 }
        ],
        previousSession: [
          { reps: 12, weight: 12.5 },
          { reps: 10, weight: 15 },
          { reps: 8, weight: 17.5 }
        ],
        notes: 'Контрольований темп'
      }
    ]
  },
  '2': {
    id: '2',
    name: 'Силова 2',
    exercises: 6,
    duration: 55,
    description: 'Силова тренування з акцентом на підтягування, віджимання та дельти',
    exercises_list: [
      {
        name: 'Присідання сумо з гирею',
        sets: [
          { reps: 12, weight: 24 },
          { reps: 12, weight: 28 },
          { reps: 12, weight: 28 },
          { reps: 12, weight: 28 },
          { reps: 12, weight: 28 }
        ],
        previousSession: [
          { reps: 12, weight: 20 },
          { reps: 12, weight: 24 },
          { reps: 10, weight: 24 },
          { reps: 10, weight: 24 },
          { reps: 8, weight: 24 }
        ],
        notes: 'Широка постановка ніг'
      },
      {
        name: 'Підтягування',
        sets: [
          { reps: 8, weight: 0, notes: 'власна вага' },
          { reps: 6, weight: 0, notes: 'власна вага' },
          { reps: 4, weight: 0, notes: 'власна вага' }
        ],
        previousSession: [
          { reps: 6, weight: 0 },
          { reps: 5, weight: 0 },
          { reps: 3, weight: 0 }
        ],
        notes: 'До відмови в кожному підході'
      },
      {
        name: 'Віджимання класика',
        sets: [
          { reps: 12, weight: 0, notes: 'власна вага' },
          { reps: 12, weight: 0, notes: 'власна вага' },
          { reps: 12, weight: 0, notes: 'власна вага' },
          { reps: 12, weight: 0, notes: 'власна вага' }
        ],
        previousSession: [
          { reps: 10, weight: 0 },
          { reps: 10, weight: 0 },
          { reps: 8, weight: 0 },
          { reps: 8, weight: 0 }
        ],
        notes: 'Класичні віджимання'
      },
      {
        name: 'Тяга в тренажері',
        sets: [
          { reps: 10, weight: 20 },
          { reps: 10, weight: 30 },
          { reps: 10, weight: 30 }
        ],
        notes: 'Поступове збільшення ваги'
      },
      {
        name: 'Розводка гантелей - бабочка',
        sets: [
          { reps: 10, weight: 12 },
          { reps: 10, weight: 14 },
          { reps: 10, weight: 14 }
        ],
        notes: 'Контроль в негативній фазі'
      },
      {
        name: 'Задня дельта',
        sets: [
          { reps: 10, weight: 15 },
          { reps: 10, weight: 20 },
          { reps: 8, weight: 20 }
        ],
        notes: 'Фокус на задню дельтовидну'
      }
    ]
  }
};

// Legacy workout data for compatibility
export const legacyWorkouts = [
  {
    id: '1',
    name: 'Силова 1',
    exercises: 6,
    duration: 60
  },
  {
    id: '2', 
    name: 'Силова 2',
    exercises: 6,
    duration: 55
  }
];

// Mock session storage to mimic database
export const sessionStorage: Record<string, Session> = {};

// Helper functions to manage mock sessions
export function createMockSession(workoutId: string, userId?: string): Session {
  const workout = workoutSeedData[workoutId];
  if (!workout) {
    throw new Error(`Workout with id ${workoutId} not found`);
  }

  // Use the mock user if no userId provided
  const sessionUserId = userId || MOCK_USER.id;
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const sessionExercises: SessionExercise[] = workout.exercises_list.map((exercise, index) => ({
    id: `exercise_${sessionId}_${index}`,
    exercise_id: `exercise_${index}`,
    exercise_name: exercise.name,
    order: index,
    notes: exercise.notes,
    sets: exercise.sets.map((set, setIndex) => ({
      id: `set_${sessionId}_${index}_${setIndex}`,
      type: 'NORMAL' as const,
      load: set.weight,
      reps: set.reps,
      completed: false,
      order: setIndex
    }))
  }));

  const session: Session = {
    id: sessionId,
    workout_id: workoutId,
    workout_name: workout.name,
    date: now,
    total_volume: 0,
    total_sets: 0,
    status: 'ACTIVE',
    current_exercise_index: 0,
    exercises: sessionExercises,
    created_at: now,
    updated_at: now
  };

  sessionStorage[sessionId] = session;
  return session;
}

export function getSession(sessionId: string): Session | null {
  // Try in-memory first (for compatibility), then file storage
  if (sessionStorage[sessionId]) {
    return sessionStorage[sessionId];
  }
  
  // In server environment, try file storage
  if (typeof window === 'undefined') {
    try {
      const { loadSession } = require('./sessionStorage');
      return loadSession(sessionId);
    } catch (error) {
      console.error('Failed to load session from file:', error);
    }
  }
  
  return null;
}

// New function to create sessions from real workout data
export async function createSessionFromRealWorkout(workoutId: string, userId?: string): Promise<Session> {
  // Import WorkoutService dynamically to avoid circular dependencies
  const { WorkoutService } = await import('@/services/WorkoutService');
  
  // Fetch the real workout from database
  const workout = await WorkoutService.getWorkoutById(workoutId);
  if (!workout) {
    throw new Error(`Workout with id ${workoutId} not found`);
  }

  // Use the mock user if no userId provided
  const sessionUserId = userId || MOCK_USER.id;
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  // Convert real workout data to session exercise format
  const sessionExercises: SessionExercise[] = workout.items.map((item, index) => ({
    id: `exercise_${sessionId}_${index}`,
    exercise_id: item.exercise.id,
    exercise_name: item.exercise.name,
    order: item.order,
    notes: item.notes || undefined,
    sets: item.sets.map((set, setIndex) => ({
      id: `set_${sessionId}_${index}_${setIndex}`,
      type: set.type,
      load: set.targetLoad,
      reps: set.targetReps,
      completed: false,
      order: set.order
    }))
  }));

  const session: Session = {
    id: sessionId,
    workout_id: workoutId,
    workout_name: workout.title,
    date: now,
    total_volume: 0,
    total_sets: 0,
    status: 'ACTIVE',
    current_exercise_index: 0,
    exercises: sessionExercises,
    created_at: now,
    updated_at: now
  };

  sessionStorage[sessionId] = session;
  
  // Also save to file storage in server environment
  if (typeof window === 'undefined') {
    try {
      const { saveSession } = require('./sessionStorage');
      saveSession(sessionId, session);
    } catch (error) {
      console.error('Failed to save session to file:', error);
    }
  }
  
  return session;
}

export function updateSession(sessionId: string, updates: Partial<Session>): Session | null {
  let session = sessionStorage[sessionId];
  
  // If not in memory, try to load from file storage
  if (!session && typeof window === 'undefined') {
    try {
      const { loadSession } = require('./sessionStorage');
      session = loadSession(sessionId);
    } catch (error) {
      console.error('Failed to load session from file:', error);
    }
  }
  
  if (!session) return null;

  const updatedSession = {
    ...session,
    ...updates,
    updated_at: new Date().toISOString()
  };

  sessionStorage[sessionId] = updatedSession;
  
  // Also update file storage in server environment
  if (typeof window === 'undefined') {
    try {
      const { saveSession } = require('./sessionStorage');
      saveSession(sessionId, updatedSession);
    } catch (error) {
      console.error('Failed to save updated session to file:', error);
    }
  }
  
  return updatedSession;
}

// Helper function to get the current mock user
export function getCurrentMockUser() {
  return MOCK_USER;
}

// Helper functions for vocabulary data
export function getMuscleGroups(): MuscleGroup[] {
  return Object.values(muscleGroupsSeed);
}

export function getEquipment(): Equipment[] {
  return Object.values(equipmentSeed);
}

export function getExercises(): ExerciseDefinition[] {
  return Object.values(exercisesSeed);
}

export function getExerciseById(id: string): ExerciseDefinition | null {
  return exercisesSeed[id] || null;
}

export function getExercisesByMuscleGroup(muscleGroupId: string): ExerciseDefinition[] {
  return Object.values(exercisesSeed).filter(exercise => exercise.muscle_group_id === muscleGroupId);
}

export function getExercisesByEquipment(equipmentId: string): ExerciseDefinition[] {
  return Object.values(exercisesSeed).filter(exercise => exercise.equipment_id === equipmentId);
}

export function searchExercises(query: string): ExerciseDefinition[] {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(exercisesSeed).filter(exercise =>
    exercise.name.toLowerCase().includes(lowercaseQuery) ||
    (exercise.description && exercise.description.toLowerCase().includes(lowercaseQuery))
  );
}

// Backward compatibility: Convert legacy exercise name to new exercise definition
export function getExerciseByName(name: string): ExerciseDefinition | null {
  return Object.values(exercisesSeed).find(exercise => exercise.name === name) || null;
}
