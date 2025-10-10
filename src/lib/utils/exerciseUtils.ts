import type { ExerciseListItem } from '@/lib/types/exercise';

/**
 * Determines if an exercise is a bodyweight exercise based on equipment
 * This is the single source of truth for bodyweight detection
 * Handles both string format (creation mode) and object format (API responses)
 */
export function isBodyweightExercise(
  exercise: ExerciseListItem | { equipment: string | { name: string } | null }
): boolean {
  if (!exercise.equipment) return false;

  // Handle both string format and object format
  const equipmentName = typeof exercise.equipment === 'string'
    ? exercise.equipment
    : exercise.equipment.name;

  const equipment = equipmentName.toLowerCase();

  // Check for bodyweight indicators in multiple languages
  return (
    equipment.includes('bodyweight') ||
    equipment.includes('власна вага') || // "own weight" in Ukrainian
    equipment.includes('власна') || // "own" in Ukrainian
    equipment === 'bodyweight' ||
    equipment === 'власна вага'
  );
}

/**
 * Helper function to check if exercise has bodyweight sets (all sets have 0 weight)
 */
export function hasBodyweightSets(sets: Array<{ targetLoad: number }>): boolean {
  return sets.length > 0 && sets.every(set => set.targetLoad === 0);
}