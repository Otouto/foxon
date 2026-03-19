import { NextResponse } from 'next/server';
import { WorkoutService } from '@/services/WorkoutService';
import type { CreateWorkoutRequest } from '@/lib/types/workout';

export async function GET() {
  try {
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
    const body: CreateWorkoutRequest = await request.json();
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
