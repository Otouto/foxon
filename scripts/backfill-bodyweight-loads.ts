import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FALLBACK_LOAD = 20;
const APPLY_FLAG = '--apply';
const FORCE_RERUN_FLAG = '--force-rerun';

/**
 * One-off migration script.
 *
 * Status:
 * - Applied successfully on the primary/only DB instance (2026-02-25).
 * - Kept for auditability and possible forensic dry-runs.
 *
 * Safety:
 * - `--apply` is intentionally blocked unless `--force-rerun` is also passed.
 * - This prevents accidental re-application on already-corrected data.
 */

function isBodyweightEquipmentName(name: string | null | undefined): boolean {
  if (!name) return false;
  const normalized = name.toLowerCase();
  return (
    normalized.includes('bodyweight') ||
    normalized.includes('власна вага') ||
    normalized.includes('власна')
  );
}

function roundLoad(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function isCorruptedBodyweightPattern(loads: number[]): boolean {
  if (loads.length < 2) return false;

  const [first, ...rest] = loads;
  if (first !== 0) return false;

  const nonZeroLoads = rest.filter(load => load !== 0);
  if (nonZeroLoads.length === 0) return false;

  // Conservative match: only fallback artifacts (0, then only 20s)
  return nonZeroLoads.every(load => load === FALLBACK_LOAD);
}

async function main() {
  const shouldApply = process.argv.includes(APPLY_FLAG);
  const forceRerun = process.argv.includes(FORCE_RERUN_FLAG);

  if (shouldApply && !forceRerun) {
    console.log('This one-off backfill has already been applied on this project DB.');
    console.log('Apply mode is locked to prevent accidental re-runs.');
    console.log(`If you intentionally need to rerun, use: ${APPLY_FLAG} ${FORCE_RERUN_FLAG}`);
    return;
  }

  console.log('Inspecting bodyweight load data...');
  console.log(`Mode: ${shouldApply ? 'APPLY CHANGES' : 'DRY RUN'}`);

  const exercises = await prisma.exercise.findMany({
    select: {
      id: true,
      name: true,
      equipment: {
        select: {
          name: true,
        },
      },
    },
  });

  const bodyweightExerciseIds = new Set(
    exercises
      .filter(exercise => isBodyweightEquipmentName(exercise.equipment?.name))
      .map(exercise => exercise.id)
  );

  if (bodyweightExerciseIds.size === 0) {
    console.log('No bodyweight exercises found. Nothing to do.');
    return;
  }

  const workoutItems = await prisma.workoutItem.findMany({
    where: {
      exerciseId: {
        in: Array.from(bodyweightExerciseIds),
      },
    },
    select: {
      id: true,
      workoutItemSets: {
        select: {
          id: true,
          order: true,
          targetLoad: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  const sessionExercises = await prisma.sessionExercise.findMany({
    where: {
      exerciseId: {
        in: Array.from(bodyweightExerciseIds),
      },
    },
    select: {
      id: true,
      sessionSets: {
        select: {
          id: true,
          order: true,
          load: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  const workoutSetIdsToFix: string[] = [];
  for (const item of workoutItems) {
    const normalized = item.workoutItemSets.map(set => ({
      ...set,
      load: roundLoad(Number(set.targetLoad)),
    }));
    const loads = normalized.map(set => set.load);

    if (!isCorruptedBodyweightPattern(loads)) continue;

    for (const set of normalized) {
      if (set.order > 1 && set.load === FALLBACK_LOAD) {
        workoutSetIdsToFix.push(set.id);
      }
    }
  }

  const sessionSetIdsToFix: string[] = [];
  for (const exercise of sessionExercises) {
    const normalized = exercise.sessionSets.map(set => ({
      ...set,
      load: roundLoad(Number(set.load)),
    }));
    const loads = normalized.map(set => set.load);

    if (!isCorruptedBodyweightPattern(loads)) continue;

    for (const set of normalized) {
      if (set.order > 1 && set.load === FALLBACK_LOAD) {
        sessionSetIdsToFix.push(set.id);
      }
    }
  }

  console.log('Candidates found:');
  console.log(`- workout_item_sets to fix: ${workoutSetIdsToFix.length}`);
  console.log(`- session_sets to fix: ${sessionSetIdsToFix.length}`);

  if (!shouldApply) {
    console.log(`Dry run complete. Re-run with "${APPLY_FLAG}" to apply updates.`);
    return;
  }

  if (workoutSetIdsToFix.length === 0 && sessionSetIdsToFix.length === 0) {
    console.log('No updates required.');
    return;
  }

  const workoutUpdateResult =
    workoutSetIdsToFix.length > 0
      ? await prisma.workoutItemSet.updateMany({
          where: {
            id: { in: workoutSetIdsToFix },
          },
          data: {
            targetLoad: 0,
          },
        })
      : { count: 0 };

  const sessionUpdateResult =
    sessionSetIdsToFix.length > 0
      ? await prisma.sessionSet.updateMany({
          where: {
            id: { in: sessionSetIdsToFix },
          },
          data: {
            load: 0,
          },
        })
      : { count: 0 };

  console.log('Backfill complete.');
  console.log(`Updated workout_item_sets: ${workoutUpdateResult.count}`);
  console.log(`Updated session_sets: ${sessionUpdateResult.count}`);
}

main()
  .catch(error => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
