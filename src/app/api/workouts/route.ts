import { NextResponse } from 'next/server';
import { WorkoutService } from '@/services/WorkoutService';
import { isAuthenticated } from '@/lib/auth';
import type { CreateWorkoutRequest } from '@/lib/types/workout';

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

export async function POST(request: Request) {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateWorkoutRequest = await request.json();

    // Create workout with ACTIVE status
    const workout = await WorkoutService.createWorkout(body);

    return NextResponse.json({
      success: true,
      workout,
    });

  } catch (error) {
    console.error('Failed to create workout:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create workout' },
      { status: 500 }
    );
  }
}
