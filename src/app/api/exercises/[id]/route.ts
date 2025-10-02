import { NextRequest, NextResponse } from 'next/server';
import { ExerciseService } from '@/services/ExerciseService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exercise = await ExerciseService.getExerciseById(id);

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error('Failed to fetch exercise:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercise' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, muscleGroupId, equipmentId, instructions, imageUrl } = await request.json();

    const exercise = await ExerciseService.updateExercise(id, {
      name,
      muscleGroupId: muscleGroupId === '' ? null : muscleGroupId,
      equipmentId: equipmentId === '' ? null : equipmentId,
      instructions: instructions === '' ? null : instructions,
      imageUrl: imageUrl === '' ? null : imageUrl,
    });

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error('Failed to update exercise:', error);

    if (error instanceof Error && error.message === 'Exercise with this name already exists') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to update exercise';
    return NextResponse.json(
      {
        error: 'Failed to update exercise',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
