import { useMemo } from 'react';

export interface PickerOption {
  value: string;
  label: string;
}

interface PickerOptionsConfig {
  weight?: {
    min?: number;
    max?: number;
    step?: number;
  };
  reps?: {
    min?: number;
    max?: number;
  };
}

interface UsePickerOptionsReturn {
  weightOptions: PickerOption[];
  repOptions: PickerOption[];
}

export function usePickerOptions(config: PickerOptionsConfig = {}): UsePickerOptionsReturn {
  const weightConfig = {
    min: 0,
    max: 200,
    step: 0.5,
    ...config.weight,
  };

  const repsConfig = {
    min: 1,
    max: 100,
    ...config.reps,
  };

  const weightOptions = useMemo(() => {
    const totalSteps = Math.floor((weightConfig.max - weightConfig.min) / weightConfig.step) + 1;
    
    return Array.from({ length: totalSteps }, (_, i) => {
      const weight = weightConfig.min + (i * weightConfig.step);
      return {
        value: weight.toString(),
        label: weight % 1 === 0 ? weight.toString() : weight.toFixed(1),
      };
    });
  }, [weightConfig.min, weightConfig.max, weightConfig.step]);

  const repOptions = useMemo(() => {
    const totalReps = repsConfig.max - repsConfig.min + 1;
    
    return Array.from({ length: totalReps }, (_, i) => {
      const reps = repsConfig.min + i;
      return {
        value: reps.toString(),
        label: reps.toString().padStart(2, '0'),
      };
    });
  }, [repsConfig.min, repsConfig.max]);

  return {
    weightOptions,
    repOptions,
  };
}