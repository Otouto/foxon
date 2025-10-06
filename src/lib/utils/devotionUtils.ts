/**
 * Devotion Score Display Utilities
 *
 * Centralized utilities for formatting and displaying devotion scores across the app.
 * This ensures consistent display logic and makes it easy to change behavior in one place.
 */

/**
 * Format devotion score for display
 * @param score - Devotion score (0-105)
 * @returns Formatted score string: "95", "100", "100+" (for scores > 100)
 */
export function formatDevotionScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '-';

  if (score > 100) return '100+';

  return Math.round(score).toString();
}

/**
 * Format devotion score with maximum for display
 * @param score - Devotion score (0-105)
 * @returns Formatted score with max: "95/100", "100/100", "100+"
 */
export function formatDevotionScoreWithMax(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'No score';

  if (score > 100) return '100+';

  return `${Math.round(score)}/100`;
}

/**
 * Get CSS glow class based on devotion score
 * @param score - Devotion score (0-105)
 * @returns CSS class name for glow effect
 */
export function getDevotionGlowClass(score: number | null | undefined): string {
  if (score === null || score === undefined) return '';

  // Perfect score (100+) - most intense glow
  if (score > 100) return 'perfect-glow';

  // Dialed in (95-100) - intense glow
  if (score >= 95) return 'lavender-glow-intense';

  // On plan (90-94) - standard glow
  if (score >= 90) return 'lavender-glow';

  // Below 90 - no glow
  return '';
}

/**
 * Check if a score qualifies for "Perfect" grade
 * @param score - Devotion score (0-105)
 * @returns true if score is above 100
 */
export function isPerfectScore(score: number | null | undefined): boolean {
  return score !== null && score !== undefined && score > 100;
}

/**
 * Get display text for devotion grade with optional emoji
 * @param grade - Devotion grade string
 * @param includeEmoji - Whether to include emoji decoration
 * @returns Formatted grade text
 */
export function formatDevotionGrade(grade: string | null | undefined, includeEmoji = false): string {
  if (!grade) return '';

  if (!includeEmoji) return grade;

  switch (grade) {
    case 'Perfect':
      return '🌟 Perfect';
    case 'Dialed in':
      return '✅ Dialed in';
    case 'On plan':
      return '👍 On plan';
    case 'Loose':
      return '⚠️ Loose';
    case 'Off plan':
      return '❌ Off plan';
    default:
      return grade;
  }
}
