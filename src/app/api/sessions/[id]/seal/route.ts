import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';
import { EffortLevel, SessionStatus } from '@prisma/client';

interface SessionSealData {
  effort: EffortLevel;
  vibeLine: string;
  note?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = getCurrentUserId();
    const { id: sessionId } = await params;
    const sealData: SessionSealData = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!sealData.effort || !sealData.vibeLine) {
      return NextResponse.json(
        { error: 'Effort level and vibe line are required' },
        { status: 400 }
      );
    }

    // Verify user owns the session and it's finished
    const session = await prisma.session.findFirst({
      where: { 
        id: sessionId, 
        userId, 
        status: SessionStatus.FINISHED 
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found, access denied, or session not finished' },
        { status: 404 }
      );
    }

    // Create or update session seal
    await prisma.sessionSeal.upsert({
      where: { sessionId },
      update: {
        effort: sealData.effort,
        vibeLine: sealData.vibeLine,
        note: sealData.note,
      },
      create: {
        sessionId,
        effort: sealData.effort,
        vibeLine: sealData.vibeLine,
        note: sealData.note,
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Session reflection saved successfully'
    });

  } catch (error) {
    console.error('Failed to save session seal:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save session reflection' },
      { status: 500 }
    );
  }
}