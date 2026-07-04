import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OuraService } from '@/services/OuraService';

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    const state = crypto.randomUUID();
    const timezone = request.nextUrl.searchParams.get('timezone');

    await prisma.user.update({
      where: { id: userId },
      data: {
        ouraAuthState: state,
        ...(timezone && isValidTimezone(timezone) ? { timezone } : {}),
      },
    });

    return NextResponse.json({ url: OuraService.buildAuthorizeUrl(state) });
  } catch (error) {
    console.error('Failed to start Oura authorization:', error);
    return NextResponse.json(
      { error: 'Failed to start Oura authorization' },
      { status: 500 }
    );
  }
}
