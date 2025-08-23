import { useCallback } from 'react';

export type HapticType = 'light' | 'medium' | 'heavy';

interface HapticFeedbackInterface {
  triggerHaptic: (type?: HapticType) => void;
  isHapticSupported: boolean;
}

export function useHapticFeedback(): HapticFeedbackInterface {
  const isHapticSupported = 'vibrate' in navigator;

  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    if (!isHapticSupported) return;

    const durations = {
      light: 10,
      medium: 20,
      heavy: 50,
    };

    navigator.vibrate(durations[type]);
  }, [isHapticSupported]);

  return {
    triggerHaptic,
    isHapticSupported,
  };
}