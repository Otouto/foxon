import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, type TextStyle } from 'react-native';

interface AnimatedCountProps {
  value: number;
  duration?: number;
  delay?: number;
  /** When false, renders the final value immediately (e.g. Reduce Motion). */
  animate?: boolean;
  style?: TextStyle | TextStyle[];
}

/**
 * Counts up to `value` with an ease-out curve — the native counterpart to the
 * web app's useAnimatedValue. Uses the core Animated API (no babel plugin).
 */
export function AnimatedCount({
  value,
  duration = 900,
  delay = 0,
  animate = true,
  style,
}: AnimatedCountProps) {
  const anim = useRef(new Animated.Value(animate ? 0 : value)).current;
  const [display, setDisplay] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) {
      setDisplay(value);
      return;
    }

    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    const animation = Animated.timing(anim, {
      toValue: value,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();

    return () => {
      anim.removeListener(id);
      animation.stop();
    };
  }, [value, animate, duration, delay, anim]);

  return <Animated.Text style={style}>{display}</Animated.Text>;
}
