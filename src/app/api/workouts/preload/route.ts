import { NextRequest, NextResponse } from 'next/server';
import { WorkoutPreloadService } from '@/services/WorkoutPreloadService';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = getCurrentUserId();
    const { workoutIds } = await request.json();

    if (!workoutIds || !Array.isArray(workoutIds)) {
      return NextResponse.json(
        { error: 'Workout IDs array is required' },
        { status: 400 }
      );
    }

    // Preload workout data
    const preloadedData = await WorkoutPreloadService.preloadMultipleWorkouts(workoutIds, userId);

    // Convert Map to object for JSON response
    const responseData: Record<string, any> = {};
    preloadedData.forEach((data, workoutId) => {
      responseData[workoutId] = {
        workout: data.workout,
        previousSessionData: Object.fromEntries(data.previousSessionData),
        lastSessionDate: data.lastSessionDate,
      };
    });

    return NextResponse.json({ 
      success: true, 
      preloadedData: responseData 
    });

  } catch (error) {
    console.error('Failed to preload workouts:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to preload workouts' },
      { status: 500 }
    );
  }
}
