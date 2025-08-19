import { PrismaClient } from '@prisma/client'
import { 
  muscleGroupsSeed, 
  equipmentSeed, 
  exercisesSeed,
  workoutSeedData 
} from '../src/lib/seedData'

const prisma = new PrismaClient()

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

  // Create a demo user (for testing purposes)
  console.log('Creating demo user...')
  const demoUser = await prisma.user.upsert({
    where: { clerkUserId: 'demo-user-123' },
    update: {},
    create: {
      clerkUserId: 'demo-user-123',
      displayName: 'Demo User',
      weeklyGoal: 2,
      progressionState: 'FIT',
    },
  })

  // Create workout templates from our seed data
  console.log('Creating workout templates...')
  
  // Workout 1: Силова 1
  const workout1 = await prisma.workout.upsert({
    where: { id: 'workout-1' },
    update: {},
    create: {
      id: 'workout-1',
      userId: demoUser.id,
      title: workoutSeedData['1'].name,
      description: workoutSeedData['1'].description,
    },
  })

  // Create workout items for Workout 1
  const workout1Exercises = [
    { exerciseKey: 'single-leg-squats', order: 1, sets: workoutSeedData['1'].exercises_list[0].sets },
    { exerciseKey: 'leg-press', order: 2, sets: workoutSeedData['1'].exercises_list[1].sets },
    { exerciseKey: 'chest-press', order: 3, sets: workoutSeedData['1'].exercises_list[2].sets },
    { exerciseKey: 'horizontal-row', order: 4, sets: workoutSeedData['1'].exercises_list[3].sets },
    { exerciseKey: 'tricep-extension', order: 5, sets: workoutSeedData['1'].exercises_list[4].sets },
    { exerciseKey: 'barbell-bicep-curl', order: 6, sets: workoutSeedData['1'].exercises_list[5].sets },
  ]

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
          notes: set.notes,
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
      userId: demoUser.id,
      title: workoutSeedData['2'].name,
      description: workoutSeedData['2'].description,
    },
  })

  // Create workout items for Workout 2
  const workout2Exercises = [
    { exerciseKey: 'sumo-squat-kettlebell', order: 1, sets: workoutSeedData['2'].exercises_list[0].sets },
    { exerciseKey: 'pull-ups', order: 2, sets: workoutSeedData['2'].exercises_list[1].sets },
    { exerciseKey: 'push-ups', order: 3, sets: workoutSeedData['2'].exercises_list[2].sets },
    { exerciseKey: 'machine-row', order: 4, sets: workoutSeedData['2'].exercises_list[3].sets },
    { exerciseKey: 'dumbbell-flyes', order: 5, sets: workoutSeedData['2'].exercises_list[4].sets },
    { exerciseKey: 'rear-delt-flyes', order: 6, sets: workoutSeedData['2'].exercises_list[5].sets },
  ]

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
          notes: set.notes,
        },
      })
    }
  }

  console.log('✅ Seed data created successfully!')
  console.log(`📊 Created:`)
  console.log(`  - ${muscleGroups.length} muscle groups`)
  console.log(`  - ${equipment.length} equipment types`)
  console.log(`  - ${exercises.length} exercises`)
  console.log(`  - 1 demo user`)
  console.log(`  - 2 workout templates with planned sets`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })