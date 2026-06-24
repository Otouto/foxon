import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';

/**
 * The fox keepsake that gently "breathes" on the Reveal / Session-complete
 * moment. Pure core Animated loop; freezes at rest under Reduce Motion.
 */
export function BreathingFox({ size = 66 }: { size?: number }) {
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.04, duration: 1500, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, scale]);

  return (
    <Animated.View
      style={[
        styles.fox,
        { width: size, height: size, borderRadius: size * 0.3, transform: [{ scale }] },
      ]}>
      <Text style={{ fontSize: size * 0.6 }}>🦊</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FA',
    shadowColor: 'rgba(34,211,238,0.5)',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
});
