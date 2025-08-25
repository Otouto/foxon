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



// Vocabulary seed data matching new ERD structure
const now = new Date().toISOString();

export const muscleGroupsSeed: Record<string, MuscleGroup> = {
  'all-muscles': {
    id: 'all-muscles',
    name: 'Всі м\'язи',
    description: 'Комплексні вправи для всіх груп м\'язів',
    created_at: now,
    updated_at: now
  },
  'abdominals': {
    id: 'abdominals',
    name: 'Черевний прес',
    description: 'Прямі та косі м\'язи живота',
    created_at: now,
    updated_at: now
  },
  'shoulders': {
    id: 'shoulders',
    name: 'Плечі',
    description: 'Дельтовидні м\'язи (передня, середня, задня дельта)',
    created_at: now,
    updated_at: now
  },
  'biceps': {
    id: 'biceps',
    name: 'Біцепси',
    description: 'Двохголові м\'язи плеча',
    created_at: now,
    updated_at: now
  },
  'triceps': {
    id: 'triceps',
    name: 'Трицепси',
    description: 'Триголові м\'язи плеча',
    created_at: now,
    updated_at: now
  },
  'forearms': {
    id: 'forearms',
    name: 'Передпліччя',
    description: 'М\'язи передпліччя для хватки та сили',
    created_at: now,
    updated_at: now
  },
  'quadriceps': {
    id: 'quadriceps',
    name: 'Квадрицепси',
    description: 'Чотириголові м\'язи стегна',
    created_at: now,
    updated_at: now
  },
  'hamstrings': {
    id: 'hamstrings',
    name: 'Біцепси стегна',
    description: 'Задня поверхня стегна',
    created_at: now,
    updated_at: now
  },
  'calves': {
    id: 'calves',
    name: 'Литки',
    description: 'Ікроножні м\'язи та камбалоподібні м\'язи',
    created_at: now,
    updated_at: now
  },
  'glutes': {
    id: 'glutes',
    name: 'Сідниці',
    description: 'Великі, середні та малі сідничні м\'язи',
    created_at: now,
    updated_at: now
  },
  'abductors': {
    id: 'abductors',
    name: 'Відводячі м\'язи',
    description: 'М\'язи, що відводять ногу в сторону',
    created_at: now,
    updated_at: now
  },
  'adductors': {
    id: 'adductors',
    name: 'Приводячі м\'язи',
    description: 'М\'язи, що приводять ногу до центру',
    created_at: now,
    updated_at: now
  },
  'lats': {
    id: 'lats',
    name: 'Широчайші м\'язи спини',
    description: 'Великі м\'язи спини для тягових рухів',
    created_at: now,
    updated_at: now
  },
  'traps': {
    id: 'traps',
    name: 'Трапеції',
    description: 'Трапецієподібні м\'язи верхньої частини спини',
    created_at: now,
    updated_at: now
  },
  'lower-back': {
    id: 'lower-back',
    name: 'Поперекові м\'язи',
    description: 'М\'язи нижньої частини спини',
    created_at: now,
    updated_at: now
  },
  'upper-back': {
    id: 'upper-back',
    name: 'Верхня частина спини',
    description: 'Ромбовидні та інші м\'язи верхньої частини спини',
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
  'cardio': {
    id: 'cardio',
    name: 'Кардіо',
    description: 'Кардіоваскулярні вправи для витривалості',
    created_at: now,
    updated_at: now
  },
  'neck': {
    id: 'neck',
    name: 'Шия',
    description: 'М\'язи шиї для стабілізації та сили',
    created_at: now,
    updated_at: now
  },
  'full-body': {
    id: 'full-body',
    name: 'Всі тіло',
    description: 'Комплексні вправи для всього тіла',
    created_at: now,
    updated_at: now
  }
};

export const equipmentSeed: Record<string, Equipment> = {
  'barbell': {
    id: 'barbell',
    name: 'Штанга',
    description: 'Олімпійська або звичайна штанга для базових вправ',
    created_at: now,
    updated_at: now
  },
  'dumbbell': {
    id: 'dumbbell',
    name: 'Гантелі',
    description: 'Розбірні або незмінні гантелі для різноманітних вправ',
    created_at: now,
    updated_at: now
  },
  'kettlebell': {
    id: 'kettlebell',
    name: 'Гиря',
    description: 'Гиря для функціональних та силових вправ',
    created_at: now,
    updated_at: now
  },
  'machine': {
    id: 'machine',
    name: 'Тренажер',
    description: 'Спеціалізовані силові тренажери',
    created_at: now,
    updated_at: now
  },
  'plate': {
    id: 'plate',
    name: 'Блини',
    description: 'Блини для штанги та гантелей',
    created_at: now,
    updated_at: now
  },
  'resistance-band': {
    id: 'resistance-band',
    name: 'Резинова стрічка',
    description: 'Резинові стрічки для опору та розтяжки',
    created_at: now,
    updated_at: now
  },
  'suspension': {
    id: 'suspension',
    name: 'Підвісна система',
    description: 'TRX або подібні підвісні системи для вправ',
    created_at: now,
    updated_at: now
  },
  'bodyweight': {
    id: 'bodyweight',
    name: 'Власна вага',
    description: 'Вправи без додаткового обладнання',
    created_at: now,
    updated_at: now
  },
  'cable': {
    id: 'cable',
    name: 'Канат',
    description: 'Канати для тяги та інших вправ',
    created_at: now,
    updated_at: now
  },
  'rope': {
    id: 'rope',
    name: 'Мотузка',
    description: 'Мотузки для тренажерів та функціональних вправ',
    created_at: now,
    updated_at: now
  }
};

export const exercisesSeed: Record<string, ExerciseDefinition> = {
  'single-leg-squats': {
    id: 'single-leg-squats',
    name: 'Присідання на 1 нозі',
    description: 'Односторонні присідання для розвитку балансу та сили',
    muscle_group_id: 'quadriceps',
    equipment_id: 'dumbbell',
    instructions: 'Тримайте гантелі в руках, виконуйте присідання на одній нозі. Фокус на балансі та контролі руху.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['quadriceps'],
    equipment: equipmentSeed['dumbbell']
  },
  'leg-press': {
    id: 'leg-press',
    name: 'Жим платформи',
    description: 'Жим ногами в тренажері',
    muscle_group_id: 'quadriceps',
    equipment_id: 'machine',
    instructions: 'Поступове збільшення ваги, контроль негативної фази.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['quadriceps'],
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
    muscle_group_id: 'lats',
    equipment_id: 'machine',
    instructions: 'Зведення лопаток в кінцевій точці.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['lats'],
    equipment: equipmentSeed['machine']
  },


  'sumo-squat-kettlebell': {
    id: 'sumo-squat-kettlebell',
    name: 'Присідання сумо з гирею',
    description: 'Присідання з широкою постановкою ніг',
    muscle_group_id: 'quadriceps',
    equipment_id: 'kettlebell',
    instructions: 'Широка постановка ніг, гиря між ніг.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['quadriceps'],
    equipment: equipmentSeed['kettlebell']
  },
  'pull-ups': {
    id: 'pull-ups',
    name: 'Підтягування',
    description: 'Підтягування на перекладині',
    muscle_group_id: 'lats',
    equipment_id: 'bodyweight',
    instructions: 'До відмови в кожному підході.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['lats'],
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

  'dumbbell-flyes': {
    id: 'dumbbell-flyes',
    name: 'Розводка гантелей бабочка',
    description: 'Розводка гантелей для грудей',
    muscle_group_id: 'chest',
    equipment_id: 'dumbbell',
    instructions: 'Контроль в негативній фазі.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['chest'],
    equipment: equipmentSeed['dumbbell']
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
  },
  'machine-row': {
    id: 'machine-row',
    name: 'Тяга в тренажері',
    description: 'Тяга сидячи в тренажері',
    muscle_group_id: 'lats',
    equipment_id: 'machine',
    instructions: 'Поступове збільшення ваги.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['lats'],
    equipment: equipmentSeed['machine']
  },

  'vertical-pull': {
    id: 'vertical-pull',
    name: 'Вертикальна тяга',
    description: 'Вертикальна тяга в тренажері',
    muscle_group_id: 'lats',
    equipment_id: 'machine',
    instructions: 'Тяга блоку до грудей, зведення лопаток.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['lats'],
    equipment: equipmentSeed['machine']
  },
  'tricep-extension': {
    id: 'tricep-extension',
    name: 'Розгинання на трицепс',
    description: 'Ізольована вправа на трицепс',
    muscle_group_id: 'triceps',
    equipment_id: 'machine',
    instructions: 'Повна амплітуда руху, контроль негативної фази.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['triceps'],
    equipment: equipmentSeed['machine']
  },
  'barbell-bicep-curl': {
    id: 'barbell-bicep-curl',
    name: 'Згинання штанги на біцепс',
    description: 'Базова вправа на біцепс зі штангою',
    muscle_group_id: 'biceps',
    equipment_id: 'barbell',
    instructions: 'Контрольований темп виконання, повна амплітуда.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['biceps'],
    equipment: equipmentSeed['barbell']
  },
  'one-arm-bent-row': {
    id: 'one-arm-bent-row',
    name: 'Тяга в нахилі по 1 руці',
    description: 'Тяга гантелі однією рукою в нахилі',
    muscle_group_id: 'lats',
    equipment_id: 'dumbbell',
    instructions: 'Тримай спину прямо, тягни гантелю до пояса.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['lats'],
    equipment: equipmentSeed['dumbbell']
  },
  'dumbbell-shoulder-press': {
    id: 'dumbbell-shoulder-press',
    name: 'Жим на плечі з гантелями',
    description: 'Жим гантелей над головою для плечей',
    muscle_group_id: 'shoulders',
    equipment_id: 'dumbbell',
    instructions: 'Жим гантелей над головою, контроль негативної фази.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['shoulders'],
    equipment: equipmentSeed['dumbbell']
  },
  'kettlebell-upright-row': {
    id: 'kettlebell-upright-row',
    name: 'Гиря протяжка',
    description: 'Тяга гирі до підборіддя для плечей та трапецій',
    muscle_group_id: 'shoulders',
    equipment_id: 'kettlebell',
    instructions: 'Тяга гирі вертикально до рівня підборіддя, лікті вище кистей.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['shoulders'],
    equipment: equipmentSeed['kettlebell']
  },
  'rear-delt-machine': {
    id: 'rear-delt-machine',
    name: 'Розводка в тренажері на задню дельту',
    description: 'Ізольована робота на задню дельтовидну в тренажері',
    muscle_group_id: 'shoulders',
    equipment_id: 'machine',
    instructions: 'Розводка рук назад в тренажері, фокус на задню дельту.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['shoulders'],
    equipment: equipmentSeed['machine']
  },
  'tricep-rope-extension': {
    id: 'tricep-rope-extension',
    name: 'Розгинання на трицепс з канатом',
    description: 'Розгинання рук з канатом в блочному тренажері',
    muscle_group_id: 'triceps',
    equipment_id: 'rope',
    instructions: 'Розгинання рук вниз з канатом, повна амплітуда.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['triceps'],
    equipment: equipmentSeed['rope']
  },
  'back-machine-row': {
    id: 'back-machine-row',
    name: 'Тяга до спини в тренажері',
    description: 'Тяга сидячи в тренажері для широчайших',
    muscle_group_id: 'lats',
    equipment_id: 'machine',
    instructions: 'Тяга до поясу в тренажері, зведення лопаток.',
    created_at: now,
    updated_at: now,
    muscle_group: muscleGroupsSeed['lats'],
    equipment: equipmentSeed['machine']
  }
};

// Sample workout data for database seeding
// This contains the structured exercise data with sets/reps that gets transformed
// into proper Prisma models during database seeding
export const workoutSeedData = {
  '1': {
    name: 'Силова 1',
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
        notes: 'Фокус на балансі та контролі руху'
      },
      {
        name: 'Вертикальна тяга',
        sets: [
          { reps: 12, weight: 40 },
          { reps: 12, weight: 40 }
        ],
        notes: 'Контроль негативної фази'
      },
      {
        name: 'Жим платформи',
        sets: [
          { reps: 10, weight: 75 },
          { reps: 10, weight: 100 },
          { reps: 10, weight: 100 },
          { reps: 10, weight: 100 },
          { reps: 10, weight: 100 }
        ],
        notes: 'Поступове збільшення ваги'
      },
      {
        name: 'Жим на грудь',
        sets: [
          { reps: 12, weight: 40 },
          { reps: 12, weight: 45 },
          { reps: 12, weight: 50 },
          { reps: 12, weight: 50 }
        ],
        notes: 'Контроль негативної фази'
      },
      {
        name: 'Горизонтальна тяга',
        sets: [
          { reps: 12, weight: 35 },
          { reps: 12, weight: 40 },
          { reps: 12, weight: 40 },
          { reps: 12, weight: 45 }
        ],
        notes: 'Зведення лопаток в кінцевій точці'
      },
      {
        name: 'Розгинання на трицепс',
        sets: [
          { reps: 12, weight: 30 },
          { reps: 12, weight: 30 },
          { reps: 12, weight: 30 },
          { reps: 12, weight: 35 }
        ],
        notes: 'Повна амплітуда руху'
      },
      {
        name: 'Згинання штанги на біцепс',
        sets: [
          { reps: 12, weight: 15 },
          { reps: 12, weight: 20 },
          { reps: 12, weight: 20 }
        ],
        notes: 'Контрольований темп виконання'
      }
    ]
  },
  '2': {
    name: 'Силова 2',
    description: 'Силова тренування з акцентом на підтягування, віджимання та дельти',
    exercises_list: [
      {
        name: 'Присідання сумо з гирею',
        sets: [
          { reps: 12, weight: 24 },
          { reps: 12, weight: 24 },
          { reps: 12, weight: 24 },
          { reps: 12, weight: 24 },
          { reps: 12, weight: 24 }
        ],
        notes: 'Широка постановка ніг'
      },
      {
        name: 'Підтягування',
        sets: [
          { reps: 8, weight: 0, notes: 'власна вага' },
          { reps: 8, weight: 0, notes: 'власна вага' },
          { reps: 8, weight: 0, notes: 'власна вага' }
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
        notes: 'Класичні віджимання від підлоги'
      },
      {
        name: 'Тяга в нахилі по 1 руці',
        sets: [
          { reps: 12, weight: 12 },
          { reps: 12, weight: 12 },
          { reps: 12, weight: 12 },
          { reps: 12, weight: 12 }
        ],
        notes: 'Тяга гантелі однією рукою'
      },
      {
        name: 'Розводка гантелей бабочка',
        sets: [
          { reps: 12, weight: 12 },
          { reps: 12, weight: 12 },
          { reps: 12, weight: 12 },
          { reps: 12, weight: 12 }
        ],
        notes: 'Контроль в негативній фазі'
      },
      {
        name: 'Жим на плечі з гантелями',
        sets: [
          { reps: 12, weight: 9 },
          { reps: 12, weight: 9 },
          { reps: 12, weight: 9 },
          { reps: 12, weight: 9 },
          { reps: 12, weight: 9 }
        ],
        notes: 'Жим гантелей над головою'
      }
    ]
  }
};



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

// Session data interface for seed data
interface SessionSeedDataItem {
  date: Date;
  duration: number;
  workoutPlan: string;
  status: string;
  devotionScore: number;
  devotionGrade: string;
  devotionPillars: { EC: number; SC: number; RF: number };
  devotionDeviations: Array<{
    type: string;
    exerciseName: string;
    description: string;
    impact: number;
  }>;
  exercises: Array<{
    name: string;
    exerciseId: string;
    sets: Array<{
      reps: number;
      weight: number;
      completed: boolean;
      order: number;
      notes?: string;
    }>;
    outOfPlan?: boolean;
    notes?: string;
  }>;
  reflection: string;
}

// Real training sessions from logs (July-August 2025)
export const sessionSeedData: Record<string, SessionSeedDataItem> = {
  // Session 1: July 1, 2025 - Силова 1
  'session-2025-07-01': {
    date: new Date('2025-07-01T09:25:00'),
    duration: 53 * 60, // 53 minutes in seconds
    workoutPlan: '1', // Reference to workout plan 1
    status: 'FINISHED',
    devotionScore: 85, // Will be calculated
    devotionGrade: 'On plan',
    devotionPillars: { EC: 0.86, SC: 0.86, RF: 0.89 },
    devotionDeviations: [
      { type: 'missed_sets', exerciseName: 'Вертикальна тяга', description: 'Missed 2 sets on Вертикальна тяга', impact: 0.33 },
      { type: 'rep_variance', exerciseName: 'Присідання на 1 нозі', description: '-2 reps on Присідання на 1 нозі', impact: 0.17 }
    ],
    exercises: [
      {
        name: 'Присідання на 1 нозі',
        exerciseId: 'single-leg-squats',
        sets: [
          { reps: 10, weight: 12, completed: true, order: 1, notes: 'по 6кг в кожній руці' },
          { reps: 10, weight: 12, completed: true, order: 2, notes: 'по 6кг в кожній руці' },
          { reps: 10, weight: 12, completed: true, order: 3, notes: 'по 6кг в кожній руці' }
        ]
      },
      {
        name: 'Вертикальна тяга',
        exerciseId: 'vertical-pull',
        sets: [
          { reps: 10, weight: 30, completed: true, order: 1 },
          { reps: 10, weight: 35, completed: true, order: 2 }
        ]
      },
      {
        name: 'Жим платформи',
        exerciseId: 'leg-press',
        sets: [
          { reps: 10, weight: 50, completed: true, order: 1 },
          { reps: 10, weight: 90, completed: true, order: 2 },
          { reps: 10, weight: 90, completed: true, order: 3 },
          { reps: 10, weight: 90, completed: true, order: 4 }
        ]
      },
      {
        name: 'Жим на грудь',
        exerciseId: 'chest-press',
        sets: [
          { reps: 10, weight: 40, completed: true, order: 1 },
          { reps: 10, weight: 40, completed: true, order: 2 },
          { reps: 10, weight: 40, completed: true, order: 3 }
        ]
      },
      {
        name: 'Горизонтальна тяга',
        exerciseId: 'horizontal-row',
        sets: [
          { reps: 12, weight: 30, completed: true, order: 1 },
          { reps: 12, weight: 35, completed: true, order: 2 },
          { reps: 12, weight: 35, completed: true, order: 3 },
          { reps: 12, weight: 35, completed: true, order: 4 }
        ]
      },
      {
        name: 'Розгинання на трицепс',
        exerciseId: 'tricep-extension',
        sets: [
          { reps: 12, weight: 20, completed: true, order: 1 },
          { reps: 12, weight: 20, completed: true, order: 2 },
          { reps: 12, weight: 20, completed: true, order: 3 }
        ]
      },
      {
        name: 'Гиря протяжка',
        exerciseId: 'kettlebell-upright-row',
        sets: [
          { reps: 12, weight: 16, completed: true, order: 1 },
          { reps: 12, weight: 16, completed: true, order: 2 },
          { reps: 12, weight: 16, completed: true, order: 3 }
        ],
        outOfPlan: true // This exercise was not in the original workout plan
      }
    ],
    reflection: '' // Empty as requested
  },

  // Session 2: July 4, 2025 - Силова 2
  'session-2025-07-04': {
    date: new Date('2025-07-04T09:44:00'),
    duration: 48 * 60 + 38, // 48:38 in seconds
    workoutPlan: '2',
    status: 'FINISHED',
    devotionScore: 78, // Lower due to missing exercises
    devotionGrade: 'Loose',
    devotionPillars: { EC: 0.67, SC: 0.83, RF: 0.92 },
    devotionDeviations: [
      { type: 'missed_exercise', exerciseName: 'Тяга в нахилі по 1 руці', description: 'Missed entire exercise', impact: 0.33 },
      { type: 'missed_exercise', exerciseName: 'Жим на плечі з гантелями', description: 'Missed entire exercise', impact: 0.33 }
    ],
    exercises: [
      {
        name: 'Присідання сумо з гирею',
        exerciseId: 'sumo-squat-kettlebell',
        sets: [
          { reps: 12, weight: 24, completed: true, order: 1 },
          { reps: 12, weight: 24, completed: true, order: 2 },
          { reps: 12, weight: 24, completed: true, order: 3 },
          { reps: 12, weight: 24, completed: true, order: 4 },
          { reps: 12, weight: 24, completed: true, order: 5 }
        ]
      },
      {
        name: 'Вертикальна тяга',
        exerciseId: 'vertical-pull',
        sets: [
          { reps: 10, weight: 30, completed: true, order: 1 },
          { reps: 10, weight: 35, completed: true, order: 2 },
          { reps: 10, weight: 40, completed: true, order: 3 },
          { reps: 10, weight: 40, completed: true, order: 4 }
        ],
        outOfPlan: true
      },
      {
        name: 'Віджимання класика',
        exerciseId: 'push-ups',
        sets: [
          { reps: 12, weight: 0, completed: true, order: 1, notes: 'власна вага' },
          { reps: 12, weight: 0, completed: true, order: 2, notes: 'власна вага' },
          { reps: 12, weight: 0, completed: true, order: 3, notes: 'власна вага' },
          { reps: 12, weight: 0, completed: true, order: 4, notes: 'власна вага' }
        ]
      },
      {
        name: 'Розводка гантелей бабочка',
        exerciseId: 'dumbbell-flyes',
        sets: [
          { reps: 12, weight: 12, completed: true, order: 1 },
          { reps: 12, weight: 12, completed: true, order: 2 }
        ]
      },
      {
        name: 'Розводка в тренажері на задню дельту',
        exerciseId: 'rear-delt-machine',
        sets: [
          { reps: 10, weight: 15, completed: true, order: 1 },
          { reps: 10, weight: 15, completed: true, order: 2 },
          { reps: 10, weight: 15, completed: true, order: 3 }
        ],
        outOfPlan: true
      }
    ],
    reflection: ''
  },

  // Session 3: July 9, 2025 - Силова 1
  'session-2025-07-09': {
    date: new Date('2025-07-09T09:05:00'),
    duration: 51 * 60 + 11,
    workoutPlan: '1',
    status: 'FINISHED',
    devotionScore: 72, // Incomplete session due to back issue
    devotionGrade: 'Loose',
    devotionPillars: { EC: 0.71, SC: 0.71, RF: 0.92 },
    devotionDeviations: [
      { type: 'missed_exercise', exerciseName: 'Вертикальна тяга', description: 'Missed entire exercise', impact: 0.29 },
      { type: 'incomplete_sets', exerciseName: 'Згинання штанги на біцепс', description: 'Incomplete due to back pain', impact: 0.33 }
    ],
    exercises: [
      {
        name: 'Присідання на 1 нозі',
        exerciseId: 'single-leg-squats',
        sets: [
          { reps: 10, weight: 12, completed: true, order: 1 },
          { reps: 10, weight: 12, completed: true, order: 2 },
          { reps: 10, weight: 12, completed: true, order: 3 }
        ]
      },
      {
        name: 'Жим платформи',
        exerciseId: 'leg-press',
        sets: [
          { reps: 10, weight: 50, completed: true, order: 1 },
          { reps: 10, weight: 90, completed: true, order: 2 },
          { reps: 10, weight: 90, completed: true, order: 3 },
          { reps: 10, weight: 90, completed: true, order: 4 }
        ]
      },
      {
        name: 'Жим на грудь',
        exerciseId: 'chest-press',
        sets: [
          { reps: 10, weight: 40, completed: true, order: 1 },
          { reps: 10, weight: 40, completed: true, order: 2 },
          { reps: 10, weight: 45, completed: true, order: 3 }
        ]
      },
      {
        name: 'Горизонтальна тяга',
        exerciseId: 'horizontal-row',
        sets: [
          { reps: 12, weight: 30, completed: true, order: 1 },
          { reps: 12, weight: 35, completed: true, order: 2 },
          { reps: 12, weight: 35, completed: true, order: 3 },
          { reps: 12, weight: 40, completed: true, order: 4 }
        ]
      },
      {
        name: 'Розгинання на трицепс',
        exerciseId: 'tricep-extension',
        sets: [
          { reps: 12, weight: 20, completed: true, order: 1 },
          { reps: 12, weight: 25, completed: true, order: 2 },
          { reps: 12, weight: 30, completed: true, order: 3 }
        ]
      },
      {
        name: 'Гиря протяжка',
        exerciseId: 'kettlebell-upright-row',
        sets: [
          { reps: 12, weight: 16, completed: true, order: 1 },
          { reps: 12, weight: 16, completed: true, order: 2 },
          { reps: 12, weight: 16, completed: true, order: 3 }
        ],
        outOfPlan: true
      },
      {
        name: 'Згинання штанги на біцепс',
        exerciseId: 'barbell-bicep-curl',
        sets: [
          { reps: 10, weight: 15, completed: true, order: 1 },
          { reps: 10, weight: 20, completed: true, order: 2, notes: 'не доробив бо спину схопило' }
        ],

      }
    ],
    reflection: ''
  },

  // Session 4: July 16, 2025 - Силова 1
  'session-2025-07-16': {
    date: new Date('2025-07-16T09:01:00'),
    duration: 52 * 60 + 10,
    workoutPlan: '1',
    status: 'FINISHED',
    devotionScore: 88, // Good execution
    devotionGrade: 'On plan',
    devotionPillars: { EC: 0.86, SC: 0.93, RF: 0.95 },
    devotionDeviations: [
      { type: 'missed_exercise', exerciseName: 'Вертикальна тяга', description: 'Missed entire exercise', impact: 0.14 }
    ],
    exercises: [
      {
        name: 'Присідання на 1 нозі',
        exerciseId: 'single-leg-squats',
        sets: [
          { reps: 10, weight: 12, completed: true, order: 1 },
          { reps: 10, weight: 12, completed: true, order: 2 },
          { reps: 10, weight: 12, completed: true, order: 3 },
          { reps: 10, weight: 12, completed: true, order: 4 }
        ]
      },
      {
        name: 'Жим платформи',
        exerciseId: 'leg-press',
        sets: [
          { reps: 10, weight: 50, completed: true, order: 1 },
          { reps: 10, weight: 95, completed: true, order: 2 },
          { reps: 10, weight: 95, completed: true, order: 3 },
          { reps: 10, weight: 95, completed: true, order: 4 }
        ]
      },
      {
        name: 'Жим на грудь',
        exerciseId: 'chest-press',
        sets: [
          { reps: 10, weight: 40, completed: true, order: 1 },
          { reps: 10, weight: 45, completed: true, order: 2 },
          { reps: 10, weight: 45, completed: true, order: 3 }
        ]
      },
      {
        name: 'Горизонтальна тяга',
        exerciseId: 'horizontal-row',
        sets: [
          { reps: 12, weight: 35, completed: true, order: 1 },
          { reps: 12, weight: 40, completed: true, order: 2 },
          { reps: 12, weight: 40, completed: true, order: 3 },
          { reps: 12, weight: 40, completed: true, order: 4 }
        ]
      },
      {
        name: 'Розгинання на трицепс',
        exerciseId: 'tricep-extension',
        sets: [
          { reps: 12, weight: 25, completed: true, order: 1 },
          { reps: 12, weight: 30, completed: true, order: 2 },
          { reps: 12, weight: 30, completed: true, order: 3 }
        ]
      },
      {
        name: 'Згинання штанги на біцепс',
        exerciseId: 'barbell-bicep-curl',
        sets: [
          { reps: 10, weight: 15, completed: true, order: 1 },
          { reps: 10, weight: 20, completed: true, order: 2 },
          { reps: 10, weight: 20, completed: true, order: 3 }
        ]
      }
    ],
    reflection: ''
  },

  // Session 5: July 19, 2025 - Силова 2
  'session-2025-07-19': {
    date: new Date('2025-07-19T14:10:00'),
    duration: 58 * 60 + 54,
    workoutPlan: '2',
    status: 'FINISHED',
    devotionScore: 82, // Good but missed some exercises
    devotionGrade: 'On plan',
    devotionPillars: { EC: 0.75, SC: 0.85, RF: 0.91 },
    devotionDeviations: [
      { type: 'rep_variance', exerciseName: 'Підтягування', description: 'Rep variance on Підтягування', impact: 0.25 },
      { type: 'rep_variance', exerciseName: 'Віджимання класика', description: 'Rep variance on Віджимання класика', impact: 0.17 }
    ],
    exercises: [
      {
        name: 'Присідання сумо з гирею',
        exerciseId: 'sumo-squat-kettlebell',
        sets: [
          { reps: 12, weight: 24, completed: true, order: 1 },
          { reps: 12, weight: 24, completed: true, order: 2 },
          { reps: 12, weight: 24, completed: true, order: 3 },
          { reps: 12, weight: 24, completed: true, order: 4 },
          { reps: 12, weight: 24, completed: true, order: 5 }
        ]
      },
      {
        name: 'Підтягування',
        exerciseId: 'pull-ups',
        sets: [
          { reps: 8, weight: 0, completed: true, order: 1, notes: 'власна вага' },
          { reps: 6, weight: 0, completed: true, order: 2, notes: 'власна вага' },
          { reps: 4, weight: 0, completed: true, order: 3, notes: 'власна вага' }
        ]
      },
      {
        name: 'Віджимання класика',
        exerciseId: 'push-ups',
        sets: [
          { reps: 12, weight: 0, completed: true, order: 1, notes: 'власна вага' },
          { reps: 12, weight: 0, completed: true, order: 2, notes: 'власна вага' },
          { reps: 10, weight: 0, completed: true, order: 3, notes: 'власна вага' },
          { reps: 10, weight: 0, completed: true, order: 4, notes: 'власна вага' }
        ]
      },
      {
        name: 'Тяга в нахилі по 1 руці',
        exerciseId: 'one-arm-bent-row',
        sets: [
          { reps: 10, weight: 12, completed: true, order: 1 },
          { reps: 10, weight: 12, completed: true, order: 2 }
        ]
      },
      {
        name: 'Розводка гантелей бабочка',
        exerciseId: 'dumbbell-flyes',
        sets: [
          { reps: 12, weight: 12, completed: true, order: 1 },
          { reps: 12, weight: 12, completed: true, order: 2 }
        ]
      }
    ],
    reflection: ''
  },

  // Session 6: July 23, 2025 - Силова 1
  'session-2025-07-23': {
    date: new Date('2025-07-23T09:26:00'),
    duration: 50 * 60 + 2,
    workoutPlan: '1',
    status: 'FINISHED',
    devotionScore: 79, // Reduced sets
    devotionGrade: 'Loose',
    devotionPillars: { EC: 0.86, SC: 0.75, RF: 0.95 },
    devotionDeviations: [
      { type: 'missed_sets', exerciseName: 'Жим платформи', description: 'Missed 2 sets', impact: 0.40 },
      { type: 'missed_sets', exerciseName: 'Горизонтальна тяга', description: 'Missed 1 set', impact: 0.25 }
    ],
    exercises: [
      {
        name: 'Присідання на 1 нозі',
        exerciseId: 'single-leg-squats',
        sets: [
          { reps: 10, weight: 12, completed: true, order: 1 },
          { reps: 10, weight: 12, completed: true, order: 2 },
          { reps: 10, weight: 12, completed: true, order: 3 }
        ]
      },
      {
        name: 'Вертикальна тяга',
        exerciseId: 'vertical-pull',
        sets: [
          { reps: 12, weight: 35, completed: true, order: 1 },
          { reps: 12, weight: 40, completed: true, order: 2 }
        ]
      },
      {
        name: 'Жим платформи',
        exerciseId: 'leg-press',
        sets: [
          { reps: 10, weight: 50, completed: true, order: 1 },
          { reps: 10, weight: 95, completed: true, order: 2 },
          { reps: 10, weight: 95, completed: true, order: 3 }
        ]
      },
      {
        name: 'Жим на грудь',
        exerciseId: 'chest-press',
        sets: [
          { reps: 10, weight: 40, completed: true, order: 1 },
          { reps: 10, weight: 45, completed: true, order: 2 },
          { reps: 10, weight: 45, completed: true, order: 3 }
        ]
      },
      {
        name: 'Горизонтальна тяга',
        exerciseId: 'horizontal-row',
        sets: [
          { reps: 12, weight: 35, completed: true, order: 1 },
          { reps: 12, weight: 40, completed: true, order: 2 },
          { reps: 12, weight: 40, completed: true, order: 3 }
        ]
      },
      {
        name: 'Розгинання на трицепс',
        exerciseId: 'tricep-extension',
        sets: [
          { reps: 12, weight: 30, completed: true, order: 1 },
          { reps: 12, weight: 30, completed: true, order: 2 },
          { reps: 12, weight: 35, completed: true, order: 3 }
        ]
      }
    ],
    reflection: ''
  },

  // Session 7: August 1, 2025 - Силова 1
  'session-2025-08-01': {
    date: new Date('2025-08-01T09:18:00'),
    duration: 51 * 60 + 3,
    workoutPlan: '1',
    status: 'FINISHED',
    devotionScore: 86, // Good session
    devotionGrade: 'On plan',
    devotionPillars: { EC: 0.86, SC: 0.89, RF: 0.87 },
    devotionDeviations: [
      { type: 'rep_variance', exerciseName: 'Жим на грудь', description: 'Rep variance on last set', impact: 0.30 }
    ],
    exercises: [
      {
        name: 'Присідання на 1 нозі',
        exerciseId: 'single-leg-squats',
        sets: [
          { reps: 10, weight: 12, completed: true, order: 1 },
          { reps: 10, weight: 12, completed: true, order: 2 },
          { reps: 10, weight: 12, completed: true, order: 3 },
          { reps: 10, weight: 12, completed: true, order: 4 }
        ]
      },
      {
        name: 'Жим платформи',
        exerciseId: 'leg-press',
        sets: [
          { reps: 10, weight: 50, completed: true, order: 1 },
          { reps: 10, weight: 95, completed: true, order: 2 },
          { reps: 10, weight: 95, completed: true, order: 3 },
          { reps: 10, weight: 95, completed: true, order: 4 }
        ]
      },
      {
        name: 'Жим на грудь',
        exerciseId: 'chest-press',
        sets: [
          { reps: 10, weight: 40, completed: true, order: 1 },
          { reps: 10, weight: 45, completed: true, order: 2 },
          { reps: 7, weight: 50, completed: true, order: 3 }
        ]
      },
      {
        name: 'Горизонтальна тяга',
        exerciseId: 'horizontal-row',
        sets: [
          { reps: 12, weight: 35, completed: true, order: 1 },
          { reps: 12, weight: 40, completed: true, order: 2 },
          { reps: 12, weight: 40, completed: true, order: 3 },
          { reps: 12, weight: 40, completed: true, order: 4 }
        ]
      },
      {
        name: 'Розгинання на трицепс',
        exerciseId: 'tricep-extension',
        sets: [
          { reps: 12, weight: 30, completed: true, order: 1 },
          { reps: 12, weight: 35, completed: true, order: 2 },
          { reps: 12, weight: 35, completed: true, order: 3 }
        ]
      },
      {
        name: 'Згинання штанги на біцепс',
        exerciseId: 'barbell-bicep-curl',
        sets: [
          { reps: 12, weight: 15, completed: true, order: 1 },
          { reps: 12, weight: 20, completed: true, order: 2 },
          { reps: 12, weight: 20, completed: true, order: 3 }
        ]
      }
    ],
    reflection: ''
  },

  // Session 8: August 6, 2025 - Силова 2
  'session-2025-08-06': {
    date: new Date('2025-08-06T08:09:00'),
    duration: 58 * 60 + 30,
    workoutPlan: '2',
    status: 'FINISHED',
    devotionScore: 85, // Good execution with progression
    devotionGrade: 'On plan',
    devotionPillars: { EC: 0.83, SC: 0.89, RF: 0.91 },
    devotionDeviations: [
      { type: 'rep_variance', exerciseName: 'Жим на плечі з гантелями', description: 'Rep variance', impact: 0.15 }
    ],
    exercises: [
      {
        name: 'Присідання сумо з гирею',
        exerciseId: 'sumo-squat-kettlebell',
        sets: [
          { reps: 12, weight: 24, completed: true, order: 1 },
          { reps: 12, weight: 28, completed: true, order: 2 },
          { reps: 12, weight: 28, completed: true, order: 3 },
          { reps: 12, weight: 28, completed: true, order: 4 },
          { reps: 12, weight: 28, completed: true, order: 5 }
        ]
      },
      {
        name: 'Підтягування',
        exerciseId: 'pull-ups',
        sets: [
          { reps: 8, weight: 0, completed: true, order: 1, notes: 'власна вага' },
          { reps: 5, weight: 0, completed: true, order: 2, notes: 'власна вага' },
          { reps: 4, weight: 0, completed: true, order: 3, notes: 'власна вага' }
        ]
      },
      {
        name: 'Віджимання класика',
        exerciseId: 'push-ups',
        sets: [
          { reps: 12, weight: 0, completed: true, order: 1, notes: 'власна вага' },
          { reps: 12, weight: 0, completed: true, order: 2, notes: 'власна вага' },
          { reps: 12, weight: 0, completed: true, order: 3, notes: 'власна вага' },
          { reps: 12, weight: 0, completed: true, order: 4, notes: 'власна вага' }
        ]
      },
      {
        name: 'Тяга в нахилі по 1 руці',
        exerciseId: 'one-arm-bent-row',
        sets: [
          { reps: 10, weight: 12, completed: true, order: 1 },
          { reps: 10, weight: 12, completed: true, order: 2 },
          { reps: 10, weight: 14, completed: true, order: 3 }
        ]
      },
      {
        name: 'Розводка гантелей бабочка',
        exerciseId: 'dumbbell-flyes',
        sets: [
          { reps: 10, weight: 12, completed: true, order: 1 },
          { reps: 10, weight: 12, completed: true, order: 2 },
          { reps: 10, weight: 12, completed: true, order: 3 }
        ]
      },
      {
        name: 'Жим на плечі з гантелями',
        exerciseId: 'dumbbell-shoulder-press',
        sets: [
          { reps: 10, weight: 9, completed: true, order: 1 },
          { reps: 10, weight: 9, completed: true, order: 2 },
          { reps: 10, weight: 9, completed: true, order: 3 },
          { reps: 10, weight: 9, completed: true, order: 4 }
        ]
      }
    ],
    reflection: ''
  },

  // Session 9: August 13, 2025 - Силова 2
  'session-2025-08-13': {
    date: new Date('2025-08-13T09:23:00'),
    duration: 54 * 60 + 41,
    workoutPlan: '2',
    status: 'FINISHED',
    devotionScore: 82, // Good consistency
    devotionGrade: 'On plan',
    devotionPillars: { EC: 0.83, SC: 0.87, RF: 0.89 },
    devotionDeviations: [
      { type: 'exercise_substitution', exerciseName: 'Тяга до спини в тренажері', description: 'Substituted exercise', impact: 0.0 }
    ],
    exercises: [
      {
        name: 'Присідання сумо з гирею',
        exerciseId: 'sumo-squat-kettlebell',
        sets: [
          { reps: 12, weight: 24, completed: true, order: 1 },
          { reps: 12, weight: 28, completed: true, order: 2 },
          { reps: 12, weight: 28, completed: true, order: 3 },
          { reps: 12, weight: 28, completed: true, order: 4 },
          { reps: 12, weight: 28, completed: true, order: 5 }
        ]
      },
      {
        name: 'Підтягування',
        exerciseId: 'pull-ups',
        sets: [
          { reps: 8, weight: 0, completed: true, order: 1, notes: 'власна вага' },
          { reps: 5, weight: 0, completed: true, order: 2, notes: 'власна вага' },
          { reps: 4, weight: 0, completed: true, order: 3, notes: 'власна вага' }
        ]
      },
      {
        name: 'Віджимання класика',
        exerciseId: 'push-ups',
        sets: [
          { reps: 12, weight: 0, completed: true, order: 1, notes: 'власна вага' },
          { reps: 12, weight: 0, completed: true, order: 2, notes: 'власна вага' },
          { reps: 12, weight: 0, completed: true, order: 3, notes: 'власна вага' },
          { reps: 12, weight: 0, completed: true, order: 4, notes: 'власна вага' }
        ]
      },
      {
        name: 'Тяга до спини в тренажері',
        exerciseId: 'back-machine-row',
        sets: [
          { reps: 10, weight: 20, completed: true, order: 1 },
          { reps: 10, weight: 30, completed: true, order: 2 },
          { reps: 10, weight: 30, completed: true, order: 3 }
        ]
      },
      {
        name: 'Розводка гантелей бабочка',
        exerciseId: 'dumbbell-flyes',
        sets: [
          { reps: 10, weight: 12, completed: true, order: 1 },
          { reps: 10, weight: 12, completed: true, order: 2 },
          { reps: 10, weight: 12, completed: true, order: 3 }
        ]
      },
      {
        name: 'Задня дельта',
        exerciseId: 'rear-delt-flyes',
        sets: [
          { reps: 10, weight: 15, completed: true, order: 1 },
          { reps: 10, weight: 20, completed: true, order: 2 },
          { reps: 10, weight: 20, completed: true, order: 3 }
        ]
      }
    ],
    reflection: ''
  },

  // Session 10: August 15, 2025 - Силова 1
  'session-2025-08-15': {
    date: new Date('2025-08-15T09:18:00'),
    duration: 60 * 60 + 46,
    workoutPlan: '1',
    status: 'FINISHED',
    devotionScore: 90, // Excellent performance
    devotionGrade: 'Dialed in',
    devotionPillars: { EC: 0.86, SC: 0.95, RF: 0.94 },
    devotionDeviations: [
      { type: 'exercise_substitution', exerciseName: 'Розгинання на трицепс з канатом', description: 'Equipment substitution', impact: 0.0 }
    ],
    exercises: [
      {
        name: 'Присідання на 1 нозі',
        exerciseId: 'single-leg-squats',
        sets: [
          { reps: 12, weight: 12, completed: true, order: 1 },
          { reps: 12, weight: 12, completed: true, order: 2 },
          { reps: 12, weight: 12, completed: true, order: 3 },
          { reps: 12, weight: 12, completed: true, order: 4 }
        ]
      },
      {
        name: 'Жим платформи',
        exerciseId: 'leg-press',
        sets: [
          { reps: 10, weight: 75, completed: true, order: 1 },
          { reps: 10, weight: 100, completed: true, order: 2 },
          { reps: 10, weight: 100, completed: true, order: 3 },
          { reps: 10, weight: 100, completed: true, order: 4 }
        ]
      },
      {
        name: 'Жим на грудь',
        exerciseId: 'chest-press',
        sets: [
          { reps: 10, weight: 40, completed: true, order: 1 },
          { reps: 10, weight: 45, completed: true, order: 2 },
          { reps: 8, weight: 50, completed: true, order: 3 }
        ]
      },
      {
        name: 'Горизонтальна тяга',
        exerciseId: 'horizontal-row',
        sets: [
          { reps: 12, weight: 40, completed: true, order: 1 },
          { reps: 12, weight: 40, completed: true, order: 2 },
          { reps: 12, weight: 40, completed: true, order: 3 },
          { reps: 12, weight: 45, completed: true, order: 4 }
        ]
      },
      {
        name: 'Розгинання на трицепс з канатом',
        exerciseId: 'tricep-rope-extension',
        sets: [
          { reps: 10, weight: 20, completed: true, order: 1 },
          { reps: 10, weight: 20, completed: true, order: 2 },
          { reps: 10, weight: 20, completed: true, order: 3 }
        ]
      },
      {
        name: 'Згинання штанги на біцепс',
        exerciseId: 'barbell-bicep-curl',
        sets: [
          { reps: 10, weight: 15, completed: true, order: 1 },
          { reps: 10, weight: 20, completed: true, order: 2 },
          { reps: 10, weight: 20, completed: true, order: 3 }
        ]
      }
    ],
    reflection: ''
  },

  // Session 11: August 20, 2025 - Силова 1 (Final session, incomplete)
  'session-2025-08-20': {
    date: new Date('2025-08-20T09:11:00'),
    duration: 62 * 60 + 22,
    workoutPlan: '1',
    status: 'FINISHED',
    devotionScore: 84, // On plan
    devotionGrade: 'On plan',
    devotionPillars: { EC: 1.0, SC: 0.88, RF: 0.66 },
    devotionDeviations: [
      { type: 'rep_variance', exerciseName: 'Жим на грудь', description: '-4 reps on Жим на грудь', impact: 0.33 },
      { type: 'rep_variance', exerciseName: 'Горизонтальна тяга', description: '-4 reps on Горизонтальна тяга', impact: 0.33 },
      { type: 'missed_sets', exerciseName: 'Жим на грудь', description: 'Missed 1 set on Жим на грудь', impact: 0.25 }
    ],
    exercises: [
      {
        name: 'Присідання на 1 нозі',
        exerciseId: 'single-leg-squats',
        sets: [
          { reps: 12, weight: 12, completed: true, order: 1 },
          { reps: 12, weight: 12, completed: true, order: 2 },
          { reps: 12, weight: 12, completed: true, order: 3 },
          { reps: 12, weight: 12, completed: true, order: 4 }
        ]
      },
      {
        name: 'Вертикальна тяга',
        exerciseId: 'vertical-pull',
        sets: [
          { reps: 12, weight: 40, completed: true, order: 1 },
          { reps: 12, weight: 40, completed: true, order: 2 }
        ]
      },
      {
        name: 'Жим платформи',
        exerciseId: 'leg-press',
        sets: [
          { reps: 10, weight: 75, completed: true, order: 1 },
          { reps: 10, weight: 100, completed: true, order: 2 },
          { reps: 10, weight: 100, completed: true, order: 3 },
          { reps: 10, weight: 100, completed: true, order: 4 }
        ]
      },
      {
        name: 'Жим на грудь',
        exerciseId: 'chest-press',
        sets: [
          { reps: 10, weight: 40, completed: true, order: 1 },
          { reps: 8, weight: 50, completed: true, order: 2 },
          { reps: 8, weight: 50, completed: true, order: 3 }
        ]
      },
      {
        name: 'Горизонтальна тяга',
        exerciseId: 'horizontal-row',
        sets: [
          { reps: 12, weight: 35, completed: true, order: 1 },
          { reps: 12, weight: 40, completed: true, order: 2 },
          { reps: 10, weight: 45, completed: true, order: 3 },
          { reps: 8, weight: 45, completed: true, order: 4 }
        ]
      },
      {
        name: 'Розгинання на трицепс',
        exerciseId: 'tricep-extension',
        sets: [
          { reps: 10, weight: 30, completed: true, order: 1 },
          { reps: 10, weight: 35, completed: true, order: 2 },
          { reps: 10, weight: 35, completed: true, order: 3 }
        ]
      },
      {
        name: 'Згинання штанги на біцепс',
        exerciseId: 'barbell-bicep-curl',
        sets: [
          { reps: 12, weight: 15, completed: true, order: 1 },
          { reps: 12, weight: 20, completed: true, order: 2 },
          { reps: 12, weight: 20, completed: true, order: 3 }
        ]
      }
    ],
    reflection: ''
  }
};

// Helper functions for session seed data
export function getSessionSeedData() {
  return sessionSeedData;
}

export function getSessionById(sessionId: string) {
  return sessionSeedData[sessionId] || null;
}

export function getSessionsByWorkoutPlan(workoutPlan: string) {
  return Object.entries(sessionSeedData)
    .filter(([, session]) => session.workoutPlan === workoutPlan)
    .map(([id, session]) => ({ id, ...session }));
}


