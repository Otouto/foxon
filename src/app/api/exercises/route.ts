import { NextRequest, NextResponse } from 'next/server';
import { ExerciseService } from '@/services/ExerciseService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    let exercises;
    if (query) {
      exercises = await ExerciseService.searchExercises(query);
    } else {
      exercises = await ExerciseService.getAllExercises();
    }

    return NextResponse.json({ exercises });
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, muscleGroupId, equipmentId, instructions, imageUrl } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      );
    }

    const exercise = await ExerciseService.createExercise({
      name,
      muscleGroupId: muscleGroupId || undefined,
      equipmentId: equipmentId || undefined,
      instructions: instructions || undefined,
      imageUrl: imageUrl || undefined,
    });

    return NextResponse.json({ exercise }, { status: 201 });
  } catch (error) {
    console.error('Failed to create exercise:', error);

    if (error instanceof Error && error.message === 'Exercise with this name already exists') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    // Return detailed error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Failed to create exercise';
    return NextResponse.json(
      {
        error: 'Failed to create exercise',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}