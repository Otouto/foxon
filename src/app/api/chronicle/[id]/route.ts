import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ChronicleService.sendChronicleEmail(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to send chronicle email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ChronicleService.deleteChronicle(id);
    revalidatePath('/chronicle');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete chronicle:', error);
    return NextResponse.json(
      { error: 'Failed to delete chronicle' },
      { status: 500 }
    );
  }
}
