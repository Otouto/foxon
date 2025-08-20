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

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session from database
    const session = await SessionService.getSession(id, userId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      session 
    });

  } catch (error) {
    console.error('Failed to get session:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // For now, we'll handle simple updates, but we should migrate to batch operations
    // This is a temporary implementation for backward compatibility
    
    // Note: This endpoint will be deprecated in favor of batch operations
    // For now, we'll just return an error encouraging use of the new batch endpoint
    return NextResponse.json(
      { error: 'This endpoint is deprecated. Please use /api/sessions/[id]/sets/batch for set updates.' },
      { status: 410 } // Gone
    );

  } catch (error) {
    console.error('Failed to update session:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update session' },
      { status: 500 }
    );
  }
}