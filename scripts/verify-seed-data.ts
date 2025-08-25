import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifySeedData() {
  console.log('🔍 Verifying seed data...\n')

  try {
    // Check muscle groups
    const muscleGroups = await prisma.muscleGroup.findMany({
      orderBy: { name: 'asc' }
    })
    
    console.log('📊 Muscle Groups:')
    console.log(`Total: ${muscleGroups.length}`)
    muscleGroups.forEach(mg => {
      console.log(`  - ${mg.name} (${mg.id})`)
      if (mg.description) {
        console.log(`    ${mg.description}`)
      }
    })

    console.log('\n📊 Equipment:')
    const equipment = await prisma.equipment.findMany({
      orderBy: { name: 'asc' }
    })
    
    console.log(`Total: ${equipment.length}`)
    equipment.forEach(eq => {
      console.log(`  - ${eq.name} (${eq.id})`)
      if (eq.description) {
        console.log(`    ${eq.description}`)
      }
    })

    console.log('\n📊 Exercises:')
    const exercises = await prisma.exercise.findMany({
      include: {
        muscleGroup: true,
        equipment: true
      },
      orderBy: { name: 'asc' }
    })
    
    console.log(`Total: ${exercises.length}`)
    exercises.forEach(ex => {
      console.log(`  - ${ex.name}`)
      console.log(`    Muscle Group: ${ex.muscleGroup?.name || 'None'}`)
      console.log(`    Equipment: ${ex.equipment?.name || 'None'}`)
    })

  } catch (error) {
    console.error('❌ Error verifying seed data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifySeedData()
