import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = getCurrentUserId();
    const { id: sessionId } = await params;
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Upsert photo (one per session)
    const photo = await prisma.sessionPhoto.upsert({
      where: { sessionId },
      create: { sessionId, imageUrl },
      update: { imageUrl },
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error saving session photo:', error);
    return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = getCurrentUserId();
    const { id: sessionId } = await params;

    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await prisma.sessionPhoto.deleteMany({
      where: { sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
