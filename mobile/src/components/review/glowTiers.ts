/**
 * Devotion glow tiers for Review timeline cards, adapted from the web app's
 * lavender-glow / lavender-glow-intense / perfect-glow (src/app/globals.css).
 */
export type GlowTier = 'none' | 'glow' | 'intense' | 'perfect';

export function getGlowTier(score: number | null | undefined): GlowTier {
  if (score == null || score < 90) return 'none';
  if (score < 95) return 'glow';
  if (score < 100) return 'intense';
  return 'perfect';
}
