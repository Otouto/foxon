import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { EffortLevel } from '@/api/types';
import { colors, spacing, typography } from '@/theme';

/**
 * Native take on the web's PillarRPEPicker: ten tappable pillars (RPE 1–10)
 * with haptic ticks. Mapping mirrors src/components/ui/PillarRPEPicker.tsx.
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
  return 'All out';
}

function colorFor(rpe: number): string {
  if (rpe <= 3) return colors.foxFit;
  if (rpe <= 6) return colors.foxStrong;
  if (rpe <= 8) return colors.warning;
  return colors.destructive;
}

interface RPEPickerProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function RPEPicker({ value, onChange, disabled }: RPEPickerProps) {
  const { triggerHaptic } = useHapticFeedback();

  return (
    <View>
      <View style={styles.pillars}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((rpe) => {
          const active = rpe <= value;
          return (
            <Pressable
              key={rpe}
              disabled={disabled}
              style={styles.pillarTouch}
              hitSlop={{ top: 8, bottom: 8 }}
              onPress={() => {
                triggerHaptic('light');
                onChange(rpe);
              }}>
              <View
                style={[
                  styles.pillar,
                  { height: 16 + rpe * 4 },
                  active
                    ? { backgroundColor: colorFor(value) }
                    : { backgroundColor: colors.fillMuted },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.labelRow}>
        <Text style={styles.valueLabel}>
          {value} · {labelFor(value)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pillars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  pillarTouch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pillar: {
    width: '100%',
    borderRadius: 4,
  },
  labelRow: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  valueLabel: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.text,
  },
});
