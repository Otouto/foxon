// Synced from src/lib/utils/exerciseUtils.ts — keep in sync with the web app.

/**
 * Determines if an exercise is a bodyweight exercise based on equipment.
 * Handles both string format and object format.
 */
export function isBodyweightExercise(exercise: {
  equipment: string | { name: string } | null;
}): boolean {
  if (!exercise.equipment) return false;

  const equipmentName =
    typeof exercise.equipment === 'string' ? exercise.equipment : exercise.equipment.name;

  const equipment = equipmentName.toLowerCase();

  return (
    equipment.includes('bodyweight') ||
    equipment.includes('власна вага') || // "own weight" in Ukrainian
    equipment.includes('власна') || // "own" in Ukrainian
    equipment === 'bodyweight' ||
    equipment === 'власна вага'
  );
}

/** True when all sets target 0 load (treated as bodyweight). */
export function hasBodyweightSets(sets: { targetLoad: number }[]): boolean {
  return sets.length > 0 && sets.every((set) => set.targetLoad === 0);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
