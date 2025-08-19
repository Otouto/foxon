import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create sample workouts
  const pushWorkout = await prisma.workout.upsert({
    where: { id: 'push-workout-1' },
    update: {},
    create: {
      id: 'push-workout-1',
      name: 'Push Day',
      description: 'Upper body pushing exercises',
      exercises: [
        {
          name: 'Bench Press',
          sets: 3,
          reps: 8,
          restTime: 120
        },
        {
          name: 'Overhead Press',
          sets: 3,
          reps: 10,
          restTime: 90
        },
        {
          name: 'Push-ups',
          sets: 3,
          reps: 15,
          restTime: 60
        },
        {
          name: 'Tricep Dips',
          sets: 3,
          reps: 12,
          restTime: 60
        }
      ]
    }
  })

  const pullWorkout = await prisma.workout.upsert({
    where: { id: 'pull-workout-1' },
    update: {},
    create: {
      id: 'pull-workout-1',
      name: 'Pull Day',
      description: 'Upper body pulling exercises',
      exercises: [
        {
          name: 'Pull-ups',
          sets: 3,
          reps: 8,
          restTime: 120
        },
        {
          name: 'Bent-over Rows',
          sets: 3,
          reps: 10,
          restTime: 90
        },
        {
          name: 'Lat Pulldowns',
          sets: 3,
          reps: 12,
          restTime: 60
        },
        {
          name: 'Bicep Curls',
          sets: 3,
          reps: 15,
          restTime: 60
        }
      ]
    }
  })

  const legWorkout = await prisma.workout.upsert({
    where: { id: 'leg-workout-1' },
    update: {},
    create: {
      id: 'leg-workout-1',
      name: 'Leg Day',
      description: 'Lower body exercises',
      exercises: [
        {
          name: 'Squats',
          sets: 4,
          reps: 10,
          restTime: 150
        },
        {
          name: 'Deadlifts',
          sets: 3,
          reps: 8,
          restTime: 180
        },
        {
          name: 'Lunges',
          sets: 3,
          reps: 12,
          restTime: 90
        },
        {
          name: 'Calf Raises',
          sets: 4,
          reps: 20,
          restTime: 45
        }
      ]
    }
  })

  console.log('✅ Seed data created:', {
    pushWorkout: pushWorkout.name,
    pullWorkout: pullWorkout.name,
    legWorkout: legWorkout.name
  })
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
