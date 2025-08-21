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
        name: 'Жим платформи',
        sets: [
          { reps: 10, weight: 75 },
          { reps: 10, weight: 75 },
          { reps: 10, weight: 100 },
          { reps: 10, weight: 100 }
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
        notes: 'Зведення лопаток в кінцевій точці'
      },
      {
        name: 'Розгинання на трицепс з канатом',
        sets: [
          { reps: 10, weight: 20 },
          { reps: 10, weight: 20 },
          { reps: 10, weight: 20 }
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
        notes: 'Контрольований темп'
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
          { reps: 12, weight: 28 },
          { reps: 12, weight: 28 },
          { reps: 12, weight: 28 },
          { reps: 12, weight: 28 }
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


