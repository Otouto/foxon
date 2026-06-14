import type { ProgressionState } from '@/api/types';
import { colors } from '@/theme';

/**
 * Per-state visuals for the fox hero. Mirrors the web app's fox palette
 * (gray / lime / cyan / cyan→purple) but expressed as a gradient bubble +
 * progress ring + colored ambient glow for the native hero treatment.
 */
export interface FoxStateVisual {
  /** Short uppercase badge label, e.g. "STRONG". */
  label: string;
  /** Warm second-person identity line shown under the fox. */
  identity: string;
  /** Bubble gradient top stop. */
  gradientFrom: string;
  /** Bubble gradient bottom stop. */
  gradientTo: string;
  /** Progress-ring stroke + score accent. */
  ring: string;
  /** iOS shadow color for the ambient glow. */
  glow: string;
  /** Pillar-bar fill in the expanded breakdown. */
  barColor: string;
}

export const FOX_STATE_VISUALS: Record<ProgressionState, FoxStateVisual> = {
  SLIM: {
    label: 'SLIM',
    identity: 'Just getting started',
    gradientFrom: colors.foxSlimSoft,
    gradientTo: colors.foxSlim,
    ring: colors.foxSlim,
    glow: colors.foxSlim,
    barColor: colors.foxSlim,
  },
  FIT: {
    label: 'FIT',
    identity: "You're getting fit",
    gradientFrom: colors.foxFitSoft,
    gradientTo: colors.foxFitDeep,
    ring: colors.foxFitDeep,
    glow: colors.foxFit,
    barColor: colors.foxFitDeep,
  },
  STRONG: {
    label: 'STRONG',
    identity: "You're strong",
    gradientFrom: colors.foxStrongSoft,
    gradientTo: colors.foxStrongDeep,
    ring: colors.foxStrongDeep,
    glow: colors.foxStrong,
    barColor: colors.foxStrongDeep,
  },
  FIERY: {
    label: 'FIERY',
    identity: "You're on fire",
    gradientFrom: colors.foxStrong,
    gradientTo: colors.foxFieryDeep,
    ring: colors.foxFieryDeep,
    glow: colors.foxFiery,
    barColor: colors.foxFieryDeep,
  },
};

/** Expressive evolution icons for the profile journey path (mirrors the web). */
export const STAGE_EMOJI: Record<ProgressionState, string> = {
  SLIM: '🦊',
  FIT: '🦊',
  STRONG: '💪',
  FIERY: '🔥',
};

/** Short stage descriptions (condensed from ProfileService.getProgressionInfo). */
export const STAGE_DESC: Record<ProgressionState, string> = {
  SLIM: 'Just starting out',
  FIT: 'Building the habit',
  STRONG: 'Getting seriously strong',
  FIERY: 'Peak performance',
};

export const FOX_STATES: ProgressionState[] = ['SLIM', 'FIT', 'STRONG', 'FIERY'];
