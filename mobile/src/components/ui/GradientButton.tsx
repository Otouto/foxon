import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, gradients, radius } from '@/theme';

type Variant = 'lime' | 'cyan';

interface GradientButtonProps {
  label: string;
  onPress?: () => void;
  onPressIn?: () => void;
  variant?: Variant;
  /** Optional SF Symbol shown after (or before) the label. */
  icon?: SymbolViewProps['name'];
  iconPlacement?: 'leading' | 'trailing';
  disabled?: boolean;
  style?: ViewStyle;
}

const VARIANTS: Record<Variant, { gradient: readonly [string, string]; ink: string; glow: string }> =
  {
    lime: { gradient: gradients.lime, ink: colors.onLime, glow: 'rgba(132,204,22,0.55)' },
    cyan: { gradient: gradients.cyan, ink: colors.onCyan, glow: 'rgba(6,182,212,0.55)' },
  };

/**
 * Full-width pill CTA with a bright gradient fill and a soft colored glow —
 * the "Foxon Soul" primary action. Lime = energy/finish, cyan = primary/next.
 */
export function GradientButton({
  label,
  onPress,
  onPressIn,
  variant = 'cyan',
  icon,
  iconPlacement = 'trailing',
  disabled,
  style,
}: GradientButtonProps) {
  const v = VARIANTS[variant];
  const symbol = icon ? (
    <SymbolView name={icon} size={18} tintColor={v.ink} weight="bold" />
  ) : null;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      disabled={disabled}
      style={({ pressed }) => [
        styles.shadow,
        { shadowColor: v.glow },
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      <LinearGradient
        colors={v.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}>
        {iconPlacement === 'leading' ? symbol : null}
        <Text style={[styles.label, { color: v.ink }]}>{label}</Text>
        {iconPlacement === 'trailing' ? symbol : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.xl,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
  },
  fill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 18,
    borderRadius: radius.xl,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
