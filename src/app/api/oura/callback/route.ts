import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { OuraService } from '@/services/OuraService';

// Public route (see src/middleware.ts): authenticated by the unguessable
// OAuth `state` persisted on the user, not by Clerk — the redirect arrives
// from Oura's site in an in-app browser session.
export const maxDuration = 60; // headroom for the historical backfill via after()

const APP_REDIRECT = 'foxon://oura-connected';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get('code');
  const state = params.get('state');

  if (params.get('error') || !code || !state) {
    return NextResponse.redirect(`${APP_REDIRECT}?error=1`, 302);
  }

  try {
    const userId = await OuraService.handleCallback(code, state);

    after(() =>
      OuraService.backfill(userId).catch(error =>
        console.error('Oura backfill failed:', error)
      )
    );

    return NextResponse.redirect(`${APP_REDIRECT}?ok=1`, 302);
  } catch (error) {
    console.error('Oura callback failed:', error);
    return NextResponse.redirect(`${APP_REDIRECT}?error=1`, 302);
  }
}
