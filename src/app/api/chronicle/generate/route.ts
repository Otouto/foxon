import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth';
import { ChronicleService } from '@/services/ChronicleService';

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();
    const { month, year, sendEmail } = body;

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month or year' },
        { status: 400 }
      );
    }

    const result = await ChronicleService.generateAndStore(userId, month, year, {
      sendEmail: sendEmail === true,
    });

    revalidatePath('/chronicle');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to generate chronicle:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate chronicle' },
      { status: 500 }
    );
  }
}
