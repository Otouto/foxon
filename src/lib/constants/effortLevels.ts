export enum EffortLevel {
  EASY = 'EASY',
  STEADY = 'STEADY',
  HARD = 'HARD',
  ALL_IN = 'ALL_IN'
}

export interface EffortLevelConfig {
  label: string;
  color: string;
}

export const effortLevelConfig: Record<EffortLevel, EffortLevelConfig> = {
  [EffortLevel.EASY]: { label: 'Easy', color: 'bg-green-400' },
  [EffortLevel.STEADY]: { label: 'Steady', color: 'bg-blue-400' },
  [EffortLevel.HARD]: { label: 'Hard', color: 'bg-orange-400' },
  [EffortLevel.ALL_IN]: { label: 'All-In', color: 'bg-red-400' }
} as const;