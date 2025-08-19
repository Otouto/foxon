import { NextRequest, NextResponse } from 'next/server';
import { createSessionFromRealWorkout } from '@/lib/seedData';

export async function POST(request: NextRequest) {
  try {
    const { workoutId } = await request.json();

    if (!workoutId) {
      return NextResponse.json(
        { error: 'Workout ID is required' },
        { status: 400 }
      );
    }

    // Create session using real workout data
    const session = await createSessionFromRealWorkout(workoutId);

    return NextResponse.json({ 
      success: true, 
      session: {
        id: session.id,
        workoutName: session.workout_name
      }
    });

  } catch (error) {
    console.error('Failed to create session:', error);
    
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
