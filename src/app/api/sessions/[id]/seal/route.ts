import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/services/SessionService';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';
import { z } from 'zod';

// Validation schema for session seal
const SessionSealSchema = z.object({
  effort: z.enum(['EASY', 'STEADY', 'HARD', 'ALL_IN']),
  vibeLine: z.string().min(1, 'Vibe line is required').max(200, 'Vibe line too long'),
  note: z.string().max(1000, 'Note too long').optional(),
});

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

    const body = await request.json();
    
    // Validate request body
    const validation = SessionSealSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const sealData = validation.data;

    // Create the session seal
    await SessionService.createSessionSeal(sessionId, userId, sealData);

    return NextResponse.json({ 
      success: true, 
      message: 'Session seal created successfully'
    });

  } catch (error) {
    console.error('Failed to create session seal:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session seal' },
      { status: 500 }
    );
  }
}
