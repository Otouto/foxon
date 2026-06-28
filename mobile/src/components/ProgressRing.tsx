import { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** Outer diameter in dp. */
  size: number;
  strokeWidth: number;
  /** 0–100. */
  progress: number;
  ringColor: string;
  trackColor: string;
  /** When set, strokes the progress arc with a top-left→bottom-right gradient (overrides ringColor). */
  ringGradient?: readonly [string, string];
  /** When set, fills the inner bubble with a top-left→bottom-right gradient. */
  bubbleGradient?: [string, string];
  animate?: boolean;
  duration?: number;
  /** Centered overlay (e.g. the fox emoji). */
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Apple-Fitness-style progress ring with an optional gradient bubble inside.
 * The ring stroke animates on mount via the core Animated API.
 */
export function ProgressRing({
  size,
  strokeWidth,
  progress,
  ringColor,
  trackColor,
  ringGradient,
  bubbleGradient,
  animate = true,
  duration = 1000,
  children,
  style,
}: ProgressRingProps) {
  const gradientId = `ring-${useId()}`;
  const clamped = Math.min(100, Math.max(0, progress));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const bubbleRadius = Math.max(0, radius - strokeWidth - 6);

  const progressAnim = useRef(new Animated.Value(animate ? 0 : clamped)).current;

  useEffect(() => {
    if (!animate) {
      progressAnim.setValue(clamped);
      return;
    }

    const animation = Animated.timing(progressAnim, {
      toValue: clamped,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();

    return () => animation.stop();
  }, [clamped, animate, duration, progressAnim]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[{ width: size, height: size }, styles.container, style]}>
      <Svg width={size} height={size}>
        <Defs>
          {bubbleGradient ? (
            <LinearGradient id="foxBubble" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={bubbleGradient[0]} />
              <Stop offset="100%" stopColor={bubbleGradient[1]} />
            </LinearGradient>
          ) : null}
          {ringGradient ? (
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={ringGradient[0]} />
              <Stop offset="100%" stopColor={ringGradient[1]} />
            </LinearGradient>
          ) : null}
        </Defs>
        {bubbleGradient ? (
          <Circle cx={center} cy={center} r={bubbleRadius} fill="url(#foxBubble)" />
        ) : null}
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
          stroke={ringGradient ? `url(#${gradientId})` : ringColor}
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
