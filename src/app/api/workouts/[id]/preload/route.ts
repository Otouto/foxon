import { NextRequest, NextResponse } from 'next/server';
import { WorkoutPreloadService } from '@/services/WorkoutPreloadService';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = getCurrentUserId();
    const { id: workoutId } = await params;
    
    if (!workoutId) {
      return NextResponse.json(
        { error: 'Workout ID is required' },
        { status: 400 }
      );
    }

    // Preload single workout data
    const preloadedData = await WorkoutPreloadService.preloadWorkoutData(workoutId, userId);

    if (!preloadedData) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    // Convert Map to object for JSON response
    const responseData = {
      workout: preloadedData.workout,
      previousSessionData: Object.fromEntries(preloadedData.previousSessionData),
      lastSessionDate: preloadedData.lastSessionDate,
    };

    return NextResponse.json({ 
      success: true, 
      preloadedData: responseData 
    });

  } catch (error) {
    console.error('Failed to preload workout:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to preload workout' },
      { status: 500 }
    );
  }
}
