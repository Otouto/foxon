/**
 * Migration script to compute initial fox form scores for all existing users.
 *
 * For each user:
 * 1. Query their sessions from the last 42 days (6-week window)
 * 2. Compute their FormScore using the new algorithm
 * 3. Set foxLevel based on the score (skip stabilization buffer for initial migration)
 * 4. Set foxFormScore and foxLastEvalAt
 *
 * Run with: npx tsx scripts/migrate-fox-levels.ts [--dry-run | --apply]
 *   --dry-run: Preview changes without writing to database (default)
 *   --apply:   Actually write the computed levels to database
 */

import { PrismaClient, SessionStatus } from '@prisma/client';

const prisma = new PrismaClient();

const WINDOW_DAYS = 42;
const WINDOW_WEEKS = 6;

type ProgressionState = 'SLIM' | 'FIT' | 'STRONG' | 'FIERY';

function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  const weekNo = 1 + Math.round(
    ((d.getTime() - yearStart.getTime()) / 86400000 - 3 + ((yearStart.getDay() + 6) % 7)) / 7
  );
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function computeFormScore(
  sessions: Array<{ date: Date; devotionScore: number | null }>,
  weeklyGoal: number
): { attendance: number; quality: number; consistency: number; total: number } {
  const totalExpected = weeklyGoal * WINDOW_WEEKS;

  const attendance = totalExpected > 0
    ? Math.min(100, (sessions.length / totalExpected) * 100)
    : 0;

  const scores = sessions
    .map(s => s.devotionScore)
    .filter((s): s is number => s !== null);
  const quality = scores.length > 0
    ? Math.min(100, scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : 0;

  const weekBuckets = new Map<string, number>();
  for (const session of sessions) {
    const key = getISOWeekKey(session.date);
    weekBuckets.set(key, (weekBuckets.get(key) || 0) + 1);
  }
  let weeksAtGoal = 0;
  for (const count of weekBuckets.values()) {
    if (count >= weeklyGoal) weeksAtGoal++;
  }
  const consistency = (weeksAtGoal / WINDOW_WEEKS) * 100;

  const total = Math.round(attendance * 0.4 + quality * 0.35 + consistency * 0.25);

  return { attendance: Math.round(attendance), quality: Math.round(quality), consistency: Math.round(consistency), total };
}

function scoreToLevel(score: number): ProgressionState {
  if (score >= 85) return 'FIERY';
  if (score >= 65) return 'STRONG';
  if (score >= 40) return 'FIT';
  return 'SLIM';
}

async function main() {
  const applyMode = process.argv.includes('--apply');
  const mode = applyMode ? 'APPLY' : 'DRY-RUN';

  console.log(`\n🦊 Fox Level Migration [${mode}]\n`);

  const users = await prisma.user.findMany({
    select: { id: true, displayName: true, weeklyGoal: true, progressionState: true },
  });

  console.log(`Found ${users.length} user(s)\n`);

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);

  for (const user of users) {
    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        status: SessionStatus.FINISHED,
        date: { gte: windowStart },
      },
      select: { date: true, devotionScore: true },
      orderBy: { date: 'asc' },
    });

    const { attendance, quality, consistency, total } = computeFormScore(sessions, user.weeklyGoal);
    const newLevel = scoreToLevel(total);

    console.log(`User: ${user.displayName || user.id}`);
    console.log(`  Sessions (6w): ${sessions.length}, Weekly goal: ${user.weeklyGoal}`);
    console.log(`  Attendance: ${attendance}, Quality: ${quality}, Consistency: ${consistency}`);
    console.log(`  Form Score: ${total} -> Level: ${newLevel}`);
    console.log(`  Old progressionState: ${user.progressionState}`);
    console.log();

    if (applyMode) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          foxFormScore: total,
          foxLevel: newLevel,
          foxLastEvalAt: new Date(),
          foxPendingPromo: null,
          foxPendingDemote: null,
          progressionState: newLevel,
        },
      });
      console.log(`  ✅ Updated\n`);
    }
  }

  if (!applyMode) {
    console.log('Dry run complete. Use --apply to write changes.');
  } else {
    console.log('Migration complete!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
