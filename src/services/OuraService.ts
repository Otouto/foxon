import { prisma } from '@/lib/prisma';
import { toLocalDay } from '@/lib/utils/dateUtils';
import { SessionStatus } from '@prisma/client';

const OURA_AUTHORIZE_URL = 'https://cloud.ouraring.com/oauth/authorize';
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token';
const OURA_API_BASE = 'https://api.ouraring.com';

const DAY_MS = 24 * 60 * 60 * 1000;
const BACKFILL_CHUNK_DAYS = 90;

interface OuraTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
}

interface OuraDailyDocument {
  id: string;
  day: string; // "YYYY-MM-DD"
  score: number | null;
}

interface OuraMultiDocResponse {
  data: OuraDailyDocument[];
  next_token: string | null;
}

/** Shifts a "YYYY-MM-DD" day string by n days (UTC-safe, no tz involved). */
function shiftDay(day: string, n: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  return new Date(date.getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

export class OuraService {
  // ── OAuth ──

  static buildAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.OURA_CLIENT_ID!,
      redirect_uri: process.env.OURA_REDIRECT_URI!,
      scope: 'daily',
      state,
    });
    return `${OURA_AUTHORIZE_URL}?${params}`;
  }

  /**
   * Exchanges the authorization code for tokens and stores them on the user
   * identified by the CSRF state. Returns the userId.
   */
  static async handleCallback(code: string, state: string): Promise<string> {
    const user = await prisma.user.findFirst({
      where: { ouraAuthState: state },
      select: { id: true },
    });
    if (!user) {
      throw new Error('Invalid or expired OAuth state');
    }

    const response = await fetch(OURA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.OURA_REDIRECT_URI!,
        client_id: process.env.OURA_CLIENT_ID!,
        client_secret: process.env.OURA_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      throw new Error(`Oura token exchange failed: ${response.status} ${await response.text()}`);
    }

    const tokens: OuraTokenResponse = await response.json();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ouraAccessToken: tokens.access_token,
        ouraRefreshToken: tokens.refresh_token,
        ouraTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        ouraConnectedAt: new Date(),
        ouraAuthState: null,
      },
    });

    return user.id;
  }

  /** Clears tokens; keeps synced OuraDailyScore rows and the user's timezone. */
  static async disconnect(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ouraAccessToken: null,
        ouraRefreshToken: null,
        ouraTokenExpiresAt: null,
        ouraConnectedAt: null,
        ouraAuthState: null,
      },
    });
  }

  // ── Token lifecycle ──

  private static async getValidAccessToken(
    userId: string,
    options: { forceRefresh?: boolean } = {}
  ): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ouraAccessToken: true,
        ouraRefreshToken: true,
        ouraTokenExpiresAt: true,
      },
    });

    if (!user?.ouraRefreshToken) {
      return null;
    }

    const stillValid =
      user.ouraAccessToken &&
      user.ouraTokenExpiresAt &&
      user.ouraTokenExpiresAt.getTime() > Date.now() + 60_000;

    if (stillValid && !options.forceRefresh) {
      return user.ouraAccessToken;
    }

    const response = await fetch(OURA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: user.ouraRefreshToken,
        client_id: process.env.OURA_CLIENT_ID!,
        client_secret: process.env.OURA_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      // invalid_grant: refresh token revoked/expired — the connection is dead
      if (response.status === 400 || response.status === 401) {
        console.error(`Oura refresh token rejected (${response.status}); disconnecting user ${userId}`);
        await this.disconnect(userId);
        return null;
      }
      throw new Error(`Oura token refresh failed: ${response.status} ${await response.text()}`);
    }

    // Oura rotates refresh tokens: always store both new tokens
    const tokens: OuraTokenResponse = await response.json();
    await prisma.user.update({
      where: { id: userId },
      data: {
        ouraAccessToken: tokens.access_token,
        ouraRefreshToken: tokens.refresh_token,
        ouraTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return tokens.access_token;
  }

  /** GET against the Oura API; on 401 refreshes once and retries. Null if not connected. */
  private static async apiGet(userId: string, pathWithQuery: string): Promise<OuraMultiDocResponse | null> {
    let token = await this.getValidAccessToken(userId);
    if (!token) return null;

    let response = await fetch(`${OURA_API_BASE}${pathWithQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      token = await this.getValidAccessToken(userId, { forceRefresh: true });
      if (!token) return null;
      response = await fetch(`${OURA_API_BASE}${pathWithQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    if (!response.ok) {
      throw new Error(`Oura API ${pathWithQuery} failed: ${response.status} ${await response.text()}`);
    }

    return response.json();
  }

  // ── Sync ──

  /**
   * Fetches daily sleep + readiness scores for [startDay, endDay] (inclusive,
   * "YYYY-MM-DD") and upserts them into OuraDailyScore. Null scores are
   * skipped so a late re-sync can only add real values, never clobber them.
   */
  static async fetchDailyScores(userId: string, startDay: string, endDay: string): Promise<void> {
    const endpoints = [
      { path: 'daily_sleep', field: 'sleepScore' as const },
      { path: 'daily_readiness', field: 'readinessScore' as const },
    ];

    for (const { path, field } of endpoints) {
      let nextToken: string | null = null;

      do {
        const params = new URLSearchParams({ start_date: startDay, end_date: endDay });
        if (nextToken) params.set('next_token', nextToken);

        const page = await this.apiGet(userId, `/v2/usercollection/${path}?${params}`);
        if (!page) return; // not connected

        for (const doc of page.data) {
          if (doc.score == null) continue;
          await prisma.ouraDailyScore.upsert({
            where: { userId_day: { userId, day: doc.day } },
            create: { userId, day: doc.day, [field]: doc.score },
            update: { [field]: doc.score },
          });
        }

        nextToken = page.next_token;
      } while (nextToken);
    }
  }

  /** Case (a): after a session completes, grab yesterday+today. No-op when not connected. */
  static async syncRecent(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { ouraRefreshToken: true, timezone: true },
    });
    if (!user?.ouraRefreshToken) return;

    const tz = user.timezone ?? 'UTC';
    const today = toLocalDay(new Date(), tz);
    const yesterday = toLocalDay(new Date(Date.now() - DAY_MS), tz);
    await this.fetchDailyScores(userId, yesterday, today);
  }

  /** Case (b) repair: re-sync a trailing window to catch scores that uploaded late. */
  static async syncLastDays(userId: string, days = 7): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { ouraRefreshToken: true, timezone: true },
    });
    if (!user?.ouraRefreshToken) return;

    const tz = user.timezone ?? 'UTC';
    const today = toLocalDay(new Date(), tz);
    await this.fetchDailyScores(userId, shiftDay(today, -days), today);
  }

  /** One-time historical backfill: earliest finished session's day through today. */
  static async backfill(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { ouraRefreshToken: true, timezone: true },
    });
    if (!user?.ouraRefreshToken) return;

    const earliest = await prisma.session.findFirst({
      where: { userId, status: SessionStatus.FINISHED },
      orderBy: { date: 'asc' },
      select: { date: true },
    });

    if (!earliest) {
      await this.syncRecent(userId);
      return;
    }

    const tz = user.timezone ?? 'UTC';
    const today = toLocalDay(new Date(), tz);
    let chunkStart = toLocalDay(earliest.date, tz);

    while (chunkStart <= today) {
      const chunkEnd = shiftDay(chunkStart, BACKFILL_CHUNK_DAYS - 1);
      await this.fetchDailyScores(userId, chunkStart, chunkEnd < today ? chunkEnd : today);
      chunkStart = shiftDay(chunkEnd, 1);
    }
  }

  /** Cron entry point: repair-sync every connected user. */
  static async syncAllConnected(days = 7): Promise<{ synced: number; errors: string[] }> {
    const users = await prisma.user.findMany({
      where: { ouraRefreshToken: { not: null } },
      select: { id: true },
    });

    let synced = 0;
    const errors: string[] = [];

    for (const { id } of users) {
      try {
        await this.syncLastDays(id, days);
        synced++;
      } catch (error) {
        errors.push(`user ${id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { synced, errors };
  }
}
