import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/services/WorkoutService';
import type { CreateWorkoutRequest } from '@/lib/types/workout';

export async function POST(request: NextRequest) {
  try {
    const data: CreateWorkoutRequest = await request.json();

    // Validate required fields
    if (!data.title?.trim()) {
      return NextResponse.json(
        { error: 'Workout title is required' },
        { status: 400 }
      );
    }

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'At least one exercise is required' },
        { status: 400 }
      );
    }

    const workout = await WorkoutService.createDraftWorkout(data);

    return NextResponse.json({ workout });
  } catch (error) {
    console.error('Failed to create draft workout:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create draft workout' },
      { status: 500 }
    );
  }
}