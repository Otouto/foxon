import { NextRequest, NextResponse } from 'next/server';
import { SessionService, SessionWithDetails } from '@/services/SessionService';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';

async function createSessionWithRetry(workoutId: string, userId: string, maxRetries = 3): Promise<SessionWithDetails> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await SessionService.createSession({
        workoutId,
        userId
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTransactionError = errorMessage.includes('Transaction not found') || 
                               errorMessage.includes('Transaction ID is invalid') ||
                               errorMessage.includes('Transaction already closed');
      
      if (isTransactionError && attempt < maxRetries) {
        console.log(`Transaction error on attempt ${attempt}, retrying... Error: ${errorMessage}`);
        // Wait briefly before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      throw error;
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('Failed to create session after maximum retries');
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (using mock auth for now)
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = getCurrentUserId();

    const { workoutId } = await request.json();

    if (!workoutId) {
      return NextResponse.json(
        { error: 'Workout ID is required' },
        { status: 400 }
      );
    }

    // Create session using database service with retry logic
    const session = await createSessionWithRetry(workoutId, userId);

    return NextResponse.json({ 
      success: true, 
      session: {
        id: session.id,
        workoutName: session.workout?.title || 'Unknown Workout'
      }
    });

  } catch (error) {
    console.error('Failed to create session after retries:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    );
  }
}
