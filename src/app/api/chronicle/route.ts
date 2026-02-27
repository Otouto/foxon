import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { ChronicleService } from '@/services/ChronicleService';

export async function GET() {
  try {
    const userId = getCurrentUserId();
    const chronicles = await ChronicleService.listChronicles(userId);
    return NextResponse.json(chronicles);
  } catch (error) {
    console.error('Failed to list chronicles:', error);
    return NextResponse.json(
      { error: 'Failed to list chronicles' },
      { status: 500 }
    );
  }
}
