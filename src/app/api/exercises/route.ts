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