import { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { gradients } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  /** Outer diameter in dp. */
  size: number;
  strokeWidth: number;
  /** 0–100. */
  progress: number;
  /** Two-stop gradient for the progress arc. Defaults to the cyan→purple journey arc. */
  gradient?: readonly [string, string];
  trackColor?: string;
  /** Animate the arc filling on mount (pair with AnimatedCount for a count-up). */
  animate?: boolean;
  duration?: number;
  /** Centered overlay (e.g. the score number). */
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Gradient progress ring used for devotion scores across the redesign — the
 * journey nodes, the Chapter hero, the Reveal. Each instance gets a unique
 * gradient id so multiple rings can share a screen without collisions.
 */
export function ScoreRing({
  size,
  strokeWidth,
  progress,
  gradient = gradients.journey,
  trackColor = '#EEF0F3',
  animate = true,
  duration = 900,
  children,
  style,
}: ScoreRingProps) {
  const id = `ring-${useId()}`;
  const clamped = Math.min(100, Math.max(0, progress));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const anim = useRef(new Animated.Value(animate ? 0 : clamped)).current;

  useEffect(() => {
    if (!animate) {
      anim.setValue(clamped);
      return;
    }
    const animation = Animated.timing(anim, {
      toValue: clamped,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, animate, duration, anim]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[{ width: size, height: size }, styles.container, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradient[0]} />
            <Stop offset="100%" stopColor={gradient[1]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${id})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {children ? (
        <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
