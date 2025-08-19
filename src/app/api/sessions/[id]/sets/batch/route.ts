import { NextRequest, NextResponse } from 'next/server';
import { SessionService, BatchSetOperation } from '@/services/SessionService';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';
import { z } from 'zod';

// Validation schema for batch operations
const BatchOperationSchema = z.object({
  setId: z.string().optional(),
  operation: z.enum(['update', 'complete', 'create', 'delete']),
  sessionExerciseId: z.string().optional(),
  data: z.object({
    type: z.enum(['WARMUP', 'NORMAL']).optional(),
    load: z.number().optional(),
    reps: z.number().optional(),
    completed: z.boolean().optional(),
    order: z.number().optional(),
    notes: z.string().optional(),
  }).optional(),
});

const BatchRequestSchema = z.object({
  operations: z.array(BatchOperationSchema).min(1),
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
    const validation = BatchRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const { operations } = validation.data;

    // Process batch operations
    const updatedSession = await SessionService.batchUpdateSets(
      sessionId,
      userId,
      operations as BatchSetOperation[]
    );

    return NextResponse.json({ 
      success: true, 
      session: updatedSession
    });

  } catch (error) {
    console.error('Failed to process batch set operations:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process batch operations' },
      { status: 500 }
    );
  }
}
