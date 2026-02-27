import { NextRequest, NextResponse } from 'next/server';
import { ChronicleService } from '@/services/ChronicleService';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chronicle = await ChronicleService.getChronicle(id);

    if (!chronicle) {
      return NextResponse.json(
        { error: 'Chronicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(chronicle);
  } catch (error) {
    console.error('Failed to get chronicle:', error);
    return NextResponse.json(
      { error: 'Failed to get chronicle' },
      { status: 500 }
    );
  }
}
