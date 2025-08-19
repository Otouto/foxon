import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/seedData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session from server-side storage
    const session = getSession(id);

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
      { error: 'Failed to get session' },
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
    const updates = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Update session in server-side storage
    const updatedSession = updateSession(id, updates);

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      session: updatedSession 
    });

  } catch (error) {
    console.error('Failed to update session:', error);
    
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
