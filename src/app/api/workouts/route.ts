import { NextResponse } from 'next/server';
import { WorkoutService } from '@/services/WorkoutService';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user workouts
    const workouts = await WorkoutService.getUserWorkouts();

    return NextResponse.json({ 
      success: true, 
      workouts 
    });

  } catch (error) {
    console.error('Failed to fetch workouts:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}
