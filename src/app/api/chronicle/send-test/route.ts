import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { ChronicleService } from '@/services/ChronicleService';

export async function POST() {
  try {
    const userId = getCurrentUserId();

    // Generate February 2026 chronicle and send email
    const result = await ChronicleService.generateAndStore(userId, 2, 2026, {
      sendEmail: true,
    });

    return NextResponse.json({
      ...result,
      message: 'Chronicle generated and email sent for February 2026',
    });
  } catch (error) {
    console.error('Failed to send test chronicle:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test chronicle' },
      { status: 500 }
    );
  }
}
