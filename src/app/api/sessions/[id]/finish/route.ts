import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/services/SessionService';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';

export async function POST(
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
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Finish the session and calculate totals
    const finishedSession = await SessionService.finishSession(sessionId, userId);

    return NextResponse.json({ 
      success: true, 
      session: finishedSession
    });

  } catch (error) {
    console.error('Failed to finish session:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to finish session' },
      { status: 500 }
    );
  }
}
