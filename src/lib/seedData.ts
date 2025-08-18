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
}

export interface Workout {
  id: string;
  name: string;
  exercises: number;
  duration: number;
  description: string;
  exercises_list: Exercise[];
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
