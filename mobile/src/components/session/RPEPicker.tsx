import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import {
  type LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { EffortLevel } from '@/api/types';
import { colors, gradients, radius } from '@/theme';

/**
 * Native take on the web's PillarRPEPicker, restyled as the "Foxon Soul" effort
 * dial: ten ascending bars where the chosen one glows lime, with a value pill
 * below. Drag across the bars (Apple-Fitness style) or tap to set.
 * Mapping mirrors src/components/ui/PillarRPEPicker.tsx.
 */
export function rpeToEffortLevel(rpe: number): EffortLevel {
  const mapping: Record<number, EffortLevel> = {
    1: 'EASY_1',
    2: 'EASY_2',
    3: 'EASY_3',
    4: 'MODERATE_4',
    5: 'MODERATE_5',
    6: 'MODERATE_6',
    7: 'HARD_7',
    8: 'HARD_8',
    9: 'ALL_OUT_9',
    10: 'ALL_OUT_10',
  };
  return mapping[rpe] || 'MODERATE_6';
}

function labelFor(rpe: number): string {
  if (rpe <= 3) return 'Easy';
  if (rpe <= 6) return 'Moderate';
  if (rpe <= 8) return 'Hard';
  return 'Brutal';
}

interface RPEPickerProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function RPEPicker({ value, onChange, disabled }: RPEPickerProps) {
  const { triggerHaptic } = useHapticFeedback();
  const widthRef = useRef(0);

  // Keep the latest props in a ref so the once-created PanResponder isn't stale.
  const handleRef = useRef<(x: number) => void>(() => {});
  handleRef.current = (x: number) => {
    if (disabled) return;
    const width = widthRef.current;
    if (!width) return;
    const slot = width / 10;
    const next = Math.max(1, Math.min(10, Math.floor(x / slot) + 1));
    if (next !== value) {
      triggerHaptic('light');
      onChange(next);
    }
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => handleRef.current(e.nativeEvent.locationX),
      onPanResponderMove: (e) => handleRef.current(e.nativeEvent.locationX),
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
  };

  return (
    <View>
      <View style={styles.bars} onLayout={onLayout} {...pan.panHandlers}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((rpe) => {
          const selected = rpe === value;
          const height = 30 + (rpe - 1) * 10;
          return (
            <View key={rpe} style={styles.barSlot}>
              {selected ? (
                <LinearGradient
                  colors={gradients.lime}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.bar, styles.barSelected, { height }]}
                />
              ) : (
                <View style={[styles.bar, styles.barIdle, { height }]} />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.dots} pointerEvents="none">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((rpe) => (
          <View key={rpe} style={styles.dotSlot}>
            <View style={[styles.dot, rpe === value ? styles.dotSelected : styles.dotIdle]} />
          </View>
        ))}
      </View>

      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>{value}</Text>
          </View>
          <Text style={styles.pillLabel}>{labelFor(value)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
    height: 128,
  },
  barSlot: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: radius.full,
  },
  barIdle: {
    backgroundColor: '#E6E8EC',
  },
  barSelected: {
    shadowColor: 'rgba(132,204,22,0.6)',
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  dots: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 11,
  },
  dotSlot: {
    flex: 1,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotIdle: {
    backgroundColor: '#CFD4DB',
  },
  dotSelected: {
    backgroundColor: colors.foxFitDeep,
  },
  pillRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 20,
    borderRadius: radius.full,
    backgroundColor: '#F4F7EE',
  },
  pillBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.foxFitDeep,
    shadowColor: 'rgba(132,204,22,0.6)',
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  pillBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onLime,
    fontVariant: ['tabular-nums'],
  },
  pillLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
});
