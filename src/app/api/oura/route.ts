import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { OuraService } from '@/services/OuraService';

export async function DELETE() {
  try {
    const userId = await getCurrentUserId();
    await OuraService.disconnect(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to disconnect Oura:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Oura' },
      { status: 500 }
    );
  }
}
