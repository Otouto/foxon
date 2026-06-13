import { useEffect, useRef } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';

interface FadeInUpProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}

/**
 * Fades + lifts its children in on mount (the native echo of the web's
 * fadeSlideUp). Skips the motion when Reduce Motion is on.
 */
export function FadeInUp({ children, delay = 0, style }: FadeInUpProps) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 450,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, delay, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
