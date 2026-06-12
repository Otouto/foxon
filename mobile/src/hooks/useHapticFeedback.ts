import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

/**
 * Same signature as the web's useHapticFeedback (src/hooks/useHapticFeedback.ts),
 * backed by Core Haptics via expo-haptics instead of navigator.vibrate.
 */
export type HapticType = 'light' | 'medium' | 'heavy';

const IMPACT_STYLES: Record<HapticType, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

export function useHapticFeedback() {
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    Haptics.impactAsync(IMPACT_STYLES[type]).catch(() => {
      // haptics are best-effort
    });
  }, []);

  return { triggerHaptic, isHapticSupported: true };
}
