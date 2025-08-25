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


