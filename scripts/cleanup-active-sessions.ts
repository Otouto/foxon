/**
 * Script to clean up ALL ACTIVE sessions and their related data
 * ⚠️  WARNING: This will delete ALL active sessions - use with caution!
 * Run with: npx tsx scripts/cleanup-active-sessions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupActiveSessions() {
  console.log('🔍 Looking for ACTIVE sessions to delete...');
  
  // Find all ACTIVE sessions
  const activeSessions = await prisma.session.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: {
      sessionExercises: {
        include: {
          sessionSets: true
        }
      },
      sessionSeal: true
    }
  });

  if (activeSessions.length === 0) {
    console.log('✅ No active sessions found!');
    return;
  }

  console.log(`⚠️  Found ${activeSessions.length} ACTIVE sessions to delete:`);
  
  // Show details of what will be deleted
  for (const session of activeSessions) {
    const exerciseCount = session.sessionExercises.length;
    const setCount = session.sessionExercises.reduce(
      (total: number, exercise: any) => total + exercise.sessionSets.length, 
      0
    );
    const completedSets = session.sessionExercises.reduce(
      (total: number, exercise: any) => total + exercise.sessionSets.filter((set: any) => set.completed).length,
      0
    );
    
    console.log(`  📍 Session ${session.id}:`);
    console.log(`     - Created: ${session.createdAt}`);
    console.log(`     - Workout ID: ${session.workoutId}`);
    console.log(`     - Exercises: ${exerciseCount}`);
    console.log(`     - Total sets: ${setCount}`);
    console.log(`     - Completed sets: ${completedSets}`);
    console.log(`     - Has seal: ${session.sessionSeal ? 'Yes' : 'No'}`);
  }

  // Confirm deletion
  console.log('\n🚨 This will permanently delete ALL the above sessions and their data!');
  console.log('   This includes:');
  console.log('   - Session records');
  console.log('   - Session exercises');
  console.log('   - Session sets');
  console.log('   - Session seals (if any)');
  
  // In a real scenario, you might want to add a confirmation prompt
  // For now, we'll proceed with deletion
  
  console.log('\n🗑️  Proceeding with deletion...');
  
  // Delete all active sessions (CASCADE will handle related records)
  const deleteResult = await prisma.session.deleteMany({
    where: {
      status: 'ACTIVE'
    }
  });

  console.log(`✅ Successfully deleted ${deleteResult.count} active sessions and all related data`);
  
  // Verify cleanup
  const remainingActive = await prisma.session.count({
    where: {
      status: 'ACTIVE'
    }
  });
  
  console.log(`📊 Remaining active sessions: ${remainingActive}`);
}

async function main() {
  try {
    await cleanupActiveSessions();
  } catch (error) {
    console.error('❌ Error cleaning up active sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
