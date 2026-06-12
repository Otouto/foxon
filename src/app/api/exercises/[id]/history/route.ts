import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { ExerciseAnalyticsService } from '@/services/ExerciseAnalyticsService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;

    const history = await ExerciseAnalyticsService.getExerciseHistory(id, userId);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Failed to fetch exercise history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercise history' },
      { status: 500 }
    );
  }
}
