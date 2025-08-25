import { PrismaClient } from '@prisma/client'
import { 
  muscleGroupsSeed, 
  equipmentSeed, 
  exercisesSeed,
  workoutSeedData,
  MOCK_USER
} from '../src/lib/seedData'

// Use direct connection for seeding to avoid pooled connection issues
const prisma = new PrismaClient(
  process.env.DIRECT_URL_ONLY === 'true' ? {
    datasources: {
      db: {
        url: process.env.DIRECT_URL
      }
    }
  } : undefined
)

async function main() {
  console.log('🌱 Seeding database...')

  // First, create muscle groups
  console.log('Creating muscle groups...')
  const muscleGroups = await Promise.all(
    Object.values(muscleGroupsSeed).map(async (mg) => {
      return prisma.muscleGroup.upsert({
        where: { id: mg.id },
        update: {
          name: mg.name,
          description: mg.description,
        },
        create: {
          id: mg.id,
          name: mg.name,
          description: mg.description,
        },
      })
    })
  )

  // Create equipment
  console.log('Creating equipment...')
  const equipment = await Promise.all(
    Object.values(equipmentSeed).map(async (eq) => {
      return prisma.equipment.upsert({
        where: { id: eq.id },
        update: {
          name: eq.name,
          description: eq.description,
        },
        create: {
          id: eq.id,
          name: eq.name,
          description: eq.description,
        },
      })
    })
  )

  // Create exercises
  console.log('Creating exercises...')
  const exercises = await Promise.all(
    Object.values(exercisesSeed).map(async (ex) => {
      return prisma.exercise.upsert({
        where: { id: ex.id },
        update: {
          name: ex.name,
          description: ex.description,
          muscleGroupId: ex.muscle_group_id,
          equipmentId: ex.equipment_id,
          instructions: ex.instructions,
        },
        create: {
          id: ex.id,
          name: ex.name,
          description: ex.description,
          muscleGroupId: ex.muscle_group_id,
          equipmentId: ex.equipment_id,
          instructions: ex.instructions,
        },
      })
    })
  )

  // Create the mock user for testing
  console.log('Creating mock user...')
  const mockUser = await prisma.user.upsert({
    where: { clerkUserId: MOCK_USER.clerkUserId },
    update: {
      displayName: MOCK_USER.displayName,
      weeklyGoal: MOCK_USER.weeklyGoal,
      progressionState: MOCK_USER.progressionState,
    },
    create: {
      id: MOCK_USER.id,
      clerkUserId: MOCK_USER.clerkUserId,
      displayName: MOCK_USER.displayName,
      weeklyGoal: MOCK_USER.weeklyGoal,
      progressionState: MOCK_USER.progressionState,
    },
  })

  // Clear existing workout data to ensure fresh seeding
  console.log('Clearing existing workout data...')
  await prisma.workoutItemSet.deleteMany({})
  await prisma.workoutItem.deleteMany({})
  await prisma.workout.deleteMany({})

  // Create workout templates from our seed data
  console.log('Creating workout templates...')
  
  // Workout 1: Силова 1
  const workout1 = await prisma.workout.upsert({
    where: { id: 'workout-1' },
    update: {},
          create: {
        id: 'workout-1',
        userId: mockUser.id,
        title: workoutSeedData['1'].name,
        description: workoutSeedData['1'].description,
      },
  })

  // Create workout items for Workout 1
  const workout1Exercises = workoutSeedData['1'].exercises_list.map((exercise, index) => {
    // Map exercise names to exercise keys
    const exerciseKeyMap: Record<string, string> = {
      'Присідання на 1 нозі': 'single-leg-squats',
      'Вертикальна тяга': 'vertical-pull',
      'Жим платформи': 'leg-press',
      'Жим на грудь': 'chest-press',
      'Горизонтальна тяга': 'horizontal-row',
      'Розгинання на трицепс': 'tricep-extension',
      'Згинання штанги на біцепс': 'barbell-bicep-curl'
    };
    
    console.log(`Mapping exercise "${exercise.name}" to key: ${exerciseKeyMap[exercise.name]}`);
    
    return {
      exerciseKey: exerciseKeyMap[exercise.name],
      order: index + 1,
      sets: exercise.sets
    };
  });

  for (const item of workout1Exercises) {
    const workoutItem = await prisma.workoutItem.upsert({
      where: { 
        workoutId_order: { 
          workoutId: workout1.id, 
          order: item.order 
        }
      },
      update: {},
      create: {
        workoutId: workout1.id,
        exerciseId: item.exerciseKey,
        order: item.order,
        notes: workoutSeedData['1'].exercises_list[item.order - 1].notes,
      },
    })

    // Create planned sets for this workout item
    for (let setIndex = 0; setIndex < item.sets.length; setIndex++) {
      const set = item.sets[setIndex]
      await prisma.workoutItemSet.upsert({
        where: {
          workoutItemId_order: {
            workoutItemId: workoutItem.id,
            order: setIndex + 1
          }
        },
        update: {},
        create: {
          workoutItemId: workoutItem.id,
          type: 'NORMAL',
          targetLoad: set.weight,
          targetReps: set.reps,
          order: setIndex + 1,
          notes: 'notes' in set ? set.notes : null,
        },
      })
    }
  }

  // Workout 2: Силова 2
  const workout2 = await prisma.workout.upsert({
    where: { id: 'workout-2' },
    update: {},
          create: {
        id: 'workout-2',
        userId: mockUser.id,
        title: workoutSeedData['2'].name,
        description: workoutSeedData['2'].description,
      },
  })

  // Create workout items for Workout 2
  const workout2Exercises = workoutSeedData['2'].exercises_list.map((exercise, index) => {
    // Map exercise names to exercise keys
    const exerciseKeyMap: Record<string, string> = {
      'Присідання сумо з гирею': 'sumo-squat-kettlebell',
      'Підтягування': 'pull-ups',
      'Віджимання класика': 'push-ups',
      'Тяга в нахилі по 1 руці': 'one-arm-bent-row',
      'Розводка гантелей бабочка': 'dumbbell-flyes',
      'Жим на плечі з гантелями': 'dumbbell-shoulder-press'
    };
    
    console.log(`Mapping exercise "${exercise.name}" to key: ${exerciseKeyMap[exercise.name]}`);
    
    return {
      exerciseKey: exerciseKeyMap[exercise.name],
      order: index + 1,
      sets: exercise.sets
    };
  });

  for (const item of workout2Exercises) {
    const workoutItem = await prisma.workoutItem.upsert({
      where: { 
        workoutId_order: { 
          workoutId: workout2.id, 
          order: item.order 
        }
      },
      update: {},
      create: {
        workoutId: workout2.id,
        exerciseId: item.exerciseKey,
        order: item.order,
        notes: workoutSeedData['2'].exercises_list[item.order - 1].notes,
      },
    })

    // Create planned sets for this workout item
    for (let setIndex = 0; setIndex < item.sets.length; setIndex++) {
      const set = item.sets[setIndex]
      await prisma.workoutItemSet.upsert({
        where: {
          workoutItemId_order: {
            workoutItemId: workoutItem.id,
            order: setIndex + 1
          }
        },
        update: {},
        create: {
          workoutItemId: workoutItem.id,
          type: 'NORMAL',
          targetLoad: set.weight,
          targetReps: set.reps,
          order: setIndex + 1,
          notes: 'notes' in set ? set.notes : null,
        },
      })
    }
  }

  console.log('✅ Seed data created successfully!')
  console.log(`📊 Created:`)
  console.log(`  - ${muscleGroups.length} muscle groups`)
  console.log(`  - ${equipment.length} equipment types`)
  console.log(`  - ${exercises.length} exercises`)
  console.log(`  - 1 mock user: ${mockUser.displayName} (${mockUser.clerkUserId})`)
  console.log(`  - 2 workout templates with planned sets`)
  console.log(``)
  console.log(`🧪 Ready for session testing!`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })