import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/services/SessionService';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user (using mock auth for now)
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = getCurrentUserId();
    const { id: sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'exerciseId parameter is required' },
        { status: 400 }
      );
    }

    // Get current session to find workoutId
    const currentSession = await SessionService.getSession(sessionId, userId);
    if (!currentSession || !currentSession.workoutId) {
      return NextResponse.json(
        { error: 'Session not found or has no workout' },
        { status: 404 }
      );
    }

    // Get previous session data for this workout and exercise
    const previousData = await SessionService.getPreviousSessionData(
      userId,
      currentSession.workoutId,
      exerciseId,
      sessionId
    );

    return NextResponse.json({ previousData });
  } catch (error) {
    console.error('Failed to get previous session data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
