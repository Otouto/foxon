// Seed data based on real workout sessions
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
export function createMockSession(workoutId: string): Session {
  const workout = workoutSeedData[workoutId];
  if (!workout) {
    throw new Error(`Workout with id ${workoutId} not found`);
  }

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
  return sessionStorage[sessionId] || null;
}

export function updateSession(sessionId: string, updates: Partial<Session>): Session | null {
  const session = sessionStorage[sessionId];
  if (!session) return null;

  const updatedSession = {
    ...session,
    ...updates,
    updated_at: new Date().toISOString()
  };

  sessionStorage[sessionId] = updatedSession;
  return updatedSession;
}
