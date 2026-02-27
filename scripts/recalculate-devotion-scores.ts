/**
 * Script to recalculate devotion scores for all FINISHED sessions
 * using the updated scoring formula (LF included with dampening).
 *
 * This script:
 * 1. Fetches all FINISHED sessions that have a linked workout
 * 2. Reconstructs planned vs actual exercise data
 * 3. Recalculates the devotion score with the new 4-pillar formula
 * 4. Shows a diff of old → new values for review
 * 5. Only applies updates after showing the full preview
 *
 * Run with: npx tsx scripts/recalculate-devotion-scores.ts [--dry-run]
 *   --dry-run: Preview changes without writing to database (default)
 *   --apply:   Actually write the recalculated scores to database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Scoring logic (duplicated from DevotionScoringService to avoid import issues) ──

const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const gmean = (xs: number[]) => Math.pow(xs.reduce((a, b) => a * b, 1), 1 / xs.length);
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const LF_DAMPEN = 0.30;

interface PlannedExercise {
  name: string;
  sets: Array<{ targetLoad: number; targetReps: number; order: number }>;
}

interface ActualExercise {
  name: string;
  sets: Array<{ load: number; reps: number; completed: boolean; order: number }>;
}

interface ScoreResult {
  CDS: number;
  grade: string;
  pillars: { EC: number; SC: number; RF: number; LF?: number };
  deviations: Array<{ type: string; exerciseName: string; description: string; impact: number }>;
}

function computeScore(planned: PlannedExercise[], actual: ActualExercise[]): ScoreResult {
  const pairs = planned.map(p => ({
    planned: p,
    actual: actual.find(a => a.name === p.name) || null,
  }));

  // EC
  const EC = pairs.filter(p => p.actual && p.actual.sets.some(s => s.completed)).length / planned.length;

  // Per-exercise scores
  const exerciseScores = pairs.map(({ planned: pl, actual: ac }) => {
    const plannedSets = pl.sets;
    const actualSets = ac?.sets || [];
    const deviations: ScoreResult['deviations'] = [];

    // SC
    const completedSets = actualSets.filter(s => s.completed);
    const sc = clamp(completedSets.length / plannedSets.length, 0, 1.02);

    if (completedSets.length < plannedSets.length) {
      const missed = plannedSets.length - completedSets.length;
      deviations.push({
        type: 'missed_sets',
        exerciseName: pl.name,
        description: `Missed ${missed} set${missed > 1 ? 's' : ''} on ${pl.name}`,
        impact: missed / plannedSets.length,
      });
    }

    // RF (asymmetric: no penalty for over)
    const repScores = plannedSets.map((ps, i) => {
      const actualReps = actualSets[i]?.reps || 0;
      const variance = actualReps - ps.targetReps;
      if (variance >= 0) return 1.0;
      const repErr = Math.abs(variance) / Math.max(1, ps.targetReps);
      const rfSet = clamp(1 - repErr / 0.30, 0, 1);
      if (repErr > 0.15 && actualSets[i]?.completed) {
        deviations.push({
          type: 'rep_variance',
          exerciseName: pl.name,
          description: `${variance} reps on ${pl.name}`,
          impact: repErr,
        });
      }
      return rfSet;
    });
    const rf = avg(repScores);

    // LF (asymmetric: no penalty for going heavier)
    const loadedSets = plannedSets.filter(s => s.targetLoad > 0);
    let lf: number | null = null;
    if (loadedSets.length > 0) {
      const loadScores = loadedSets.map(ps => {
        const as = actualSets.find(a => a.order === ps.order);
        const actualWeight = as?.load || 0;
        if (actualWeight >= ps.targetLoad) return 1.0;
        const baseWeight = Math.max(ps.targetLoad, 5);
        const loadErr = (ps.targetLoad - actualWeight) / baseWeight;
        const lfSet = clamp(1 - loadErr / 0.30, 0, 1);
        if (loadErr > 0.15 && as?.completed) {
          const variance = ((actualWeight - ps.targetLoad) / ps.targetLoad) * 100;
          deviations.push({
            type: 'load_variance',
            exerciseName: pl.name,
            description: `${Math.round(variance)}% load on ${pl.name}`,
            impact: loadErr,
          });
        }
        return lfSet;
      });
      lf = avg(loadScores);
    }

    return { sc, rf, lf, weight: plannedSets.length, deviations };
  });

  // Aggregate
  const totalWeight = exerciseScores.reduce((s, e) => s + e.weight, 0) || 1;
  const SC = exerciseScores.reduce((s, e) => s + e.sc * e.weight, 0) / totalWeight;
  const RF = exerciseScores.reduce((s, e) => s + e.rf * e.weight, 0) / totalWeight;

  const loadedScores = exerciseScores.filter(e => e.lf !== null);
  const rawLF = loadedScores.length > 0
    ? loadedScores.reduce((s, e) => s + e.lf! * e.weight, 0) / loadedScores.reduce((s, e) => s + e.weight, 0)
    : null;

  const dampenedLF = rawLF !== null ? 1.0 - LF_DAMPEN * (1.0 - rawLF) : null;
  const scoreParts = dampenedLF !== null ? [EC, SC, RF, dampenedLF] : [EC, SC, RF];
  let CDS = Math.round(100 * gmean(scoreParts));

  // Bonus
  const perfectExecution = SC >= 1.0 && RF >= 1.0 && EC >= 1.0;
  if (perfectExecution) {
    const hasOverperformance = pairs.some(({ planned: pl, actual: ac }) => {
      if (!ac) return false;
      return pl.sets.some((ps, i) => {
        const as = ac.sets[i];
        return as?.completed && as.reps > ps.targetReps;
      });
    });
    if (hasOverperformance) CDS = Math.min(105, CDS + 5);
  }

  const grade = CDS > 100 ? 'Perfect' :
    CDS >= 90 ? 'Dialed in' :
    CDS >= 80 ? 'On plan' :
    CDS >= 70 ? 'Loose' : 'Off plan';

  // Deviations
  const allDeviations = exerciseScores.flatMap(e => e.deviations);
  const ranked = allDeviations
    .sort((a, b) => b.impact - a.impact)
    .filter((d, i, arr) => arr.findIndex(x => x.exerciseName === d.exerciseName && x.type === d.type) === i)
    .slice(0, 3);

  return {
    CDS,
    grade,
    pillars: {
      EC: Math.round(EC * 100) / 100,
      SC: Math.round(SC * 100) / 100,
      RF: Math.round(RF * 100) / 100,
      ...(rawLF !== null ? { LF: Math.round(rawLF * 100) / 100 } : {}),
    },
    deviations: ranked,
  };
}

// ── Main script ──

async function recalculateScores(dryRun: boolean) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(dryRun
    ? '  DRY RUN — Preview only, no database changes'
    : '  LIVE RUN — Will update database');
  console.log(`${'='.repeat(60)}\n`);

  // Fetch all FINISHED sessions with a linked workout
  const sessions = await prisma.session.findMany({
    where: {
      status: 'FINISHED',
      workoutId: { not: null },
    },
    include: {
      sessionExercises: {
        include: {
          exercise: true,
          sessionSets: { orderBy: { order: 'asc' } },
        },
        orderBy: { order: 'asc' },
      },
      workout: {
        include: {
          workoutItems: {
            include: {
              exercise: true,
              workoutItemSets: { orderBy: { order: 'asc' } },
            },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  console.log(`Found ${sessions.length} finished session(s) to recalculate.\n`);

  if (sessions.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let changed = 0;
  let unchanged = 0;
  let skipped = 0;

  const updates: Array<{
    sessionId: string;
    oldScore: number | null;
    newScore: number;
    oldGrade: string | null;
    newGrade: string;
    oldPillars: Record<string, number> | null;
    newPillars: Record<string, number>;
  }> = [];

  for (const session of sessions) {
    if (!session.workout) {
      console.log(`  SKIP Session ${session.id} — workout not found (deleted?)`);
      skipped++;
      continue;
    }

    // Reconstruct planned exercises from workout template
    const planned: PlannedExercise[] = session.workout.workoutItems.map(item => ({
      name: item.exercise.name,
      sets: item.workoutItemSets.map(s => ({
        targetLoad: Number(s.targetLoad),
        targetReps: s.targetReps,
        order: s.order,
      })),
    }));

    // Reconstruct actual exercises from session data
    const actual: ActualExercise[] = session.sessionExercises.map(se => ({
      name: se.exercise.name,
      sets: se.sessionSets.map(ss => ({
        load: Number(ss.load),
        reps: ss.reps,
        completed: ss.completed,
        order: ss.order,
      })),
    }));

    if (planned.length === 0) {
      console.log(`  SKIP Session ${session.id} — workout has no exercises`);
      skipped++;
      continue;
    }

    const result = computeScore(planned, actual);

    if (result.CDS === session.devotionScore && result.grade === session.devotionGrade) {
      unchanged++;
      continue;
    }

    updates.push({
      sessionId: session.id,
      oldScore: session.devotionScore,
      newScore: result.CDS,
      oldGrade: session.devotionGrade,
      newGrade: result.grade,
      oldPillars: session.devotionPillars as Record<string, number> | null,
      newPillars: result.pillars,
    });

    changed++;
  }

  // Print summary
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Summary: ${changed} changed | ${unchanged} unchanged | ${skipped} skipped`);
  console.log(`${'─'.repeat(60)}\n`);

  if (updates.length > 0) {
    console.log('Changes:\n');
    for (const u of updates) {
      const oldPillarStr = u.oldPillars
        ? `EC=${u.oldPillars.EC ?? '?'} SC=${u.oldPillars.SC ?? '?'} RF=${u.oldPillars.RF ?? '?'} LF=${u.oldPillars.LF ?? '-'}`
        : 'none';
      const newPillarStr = `EC=${u.newPillars.EC} SC=${u.newPillars.SC} RF=${u.newPillars.RF} LF=${u.newPillars.LF ?? '-'}`;

      console.log(`  Session ${u.sessionId}:`);
      console.log(`    Score: ${u.oldScore ?? 'null'} → ${u.newScore}  |  Grade: ${u.oldGrade ?? 'null'} → ${u.newGrade}`);
      console.log(`    Pillars: ${oldPillarStr}`);
      console.log(`          →  ${newPillarStr}`);
      console.log('');
    }
  }

  if (dryRun) {
    console.log('DRY RUN complete. To apply changes, run with --apply flag.');
    return;
  }

  // Apply updates
  console.log('Applying updates...\n');

  for (const u of updates) {
    // Re-compute full result for this session (we need deviations too)
    const session = sessions.find(s => s.id === u.sessionId)!;
    const planned: PlannedExercise[] = session.workout!.workoutItems.map(item => ({
      name: item.exercise.name,
      sets: item.workoutItemSets.map(s => ({
        targetLoad: Number(s.targetLoad),
        targetReps: s.targetReps,
        order: s.order,
      })),
    }));
    const actual: ActualExercise[] = session.sessionExercises.map(se => ({
      name: se.exercise.name,
      sets: se.sessionSets.map(ss => ({
        load: Number(ss.load),
        reps: ss.reps,
        completed: ss.completed,
        order: ss.order,
      })),
    }));
    const result = computeScore(planned, actual);

    await prisma.session.update({
      where: { id: u.sessionId },
      data: {
        devotionScore: result.CDS,
        devotionGrade: result.grade,
        devotionPillars: JSON.parse(JSON.stringify(result.pillars)),
        devotionDeviations: JSON.parse(JSON.stringify(result.deviations)),
      },
    });

    console.log(`  Updated session ${u.sessionId}: ${u.oldScore} → ${result.CDS}`);
  }

  console.log(`\nDone! Updated ${updates.length} session(s).`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  try {
    await recalculateScores(dryRun);
  } catch (error) {
    console.error('Error recalculating devotion scores:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
