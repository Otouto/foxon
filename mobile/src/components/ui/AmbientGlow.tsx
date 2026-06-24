import { useId } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface AmbientGlowProps {
  /** Center color of the radial wash (already includes desired alpha). */
  color: string;
  /** Glow box size in dp. */
  width: number;
  height: number;
  /** How far the color reaches before fading to transparent (0–1). */
  spread?: number;
  /** Absolute-positioning offsets; the glow is pointer-events:none decoration. */
  style?: ViewStyle;
}

/**
 * A soft radial-gradient blob for the top-of-screen ambient washes in the
 * "Foxon Soul" redesign. Rendered with react-native-svg (no blur dependency);
 * the gradient itself gives the soft falloff. Purely decorative.
 */
export function AmbientGlow({ color, width, height, spread = 0.7, style }: AmbientGlowProps) {
  const gradientId = `glow-${useId()}`;

  return (
    <View pointerEvents="none" style={[styles.base, { width, height }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={1} />
            <Stop offset={`${Math.round(spread * 100)}%`} stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
  },
});
