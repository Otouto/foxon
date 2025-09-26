import { NextRequest, NextResponse } from 'next/server';
import { WorkoutService } from '@/services/WorkoutService';
import type { UpdateWorkoutRequest } from '@/lib/types/workout';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const workout = await WorkoutService.getWorkoutById(id);

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workout);
  } catch (error) {
    console.error('Failed to fetch workout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const body: UpdateWorkoutRequest = await request.json();

    let updatedWorkout;

    if (status === 'DRAFT') {
      // Update as draft
      updatedWorkout = await WorkoutService.updateWorkout(id, body);
      if (updatedWorkout) {
        await WorkoutService.updateWorkoutStatus(id, 'DRAFT');
      }
    } else {
      // Update as active workout
      updatedWorkout = await WorkoutService.updateWorkout(id, body);
      if (updatedWorkout) {
        await WorkoutService.updateWorkoutStatus(id, 'ACTIVE');
      }
    }

    if (!updatedWorkout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedWorkout);
  } catch (error) {
    console.error('Failed to update workout:', error);
    return NextResponse.json(
      { error: 'Failed to update workout' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const success = await WorkoutService.deleteWorkout(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Workout not found or could not be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Failed to delete workout:', error);
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    );
  }
}