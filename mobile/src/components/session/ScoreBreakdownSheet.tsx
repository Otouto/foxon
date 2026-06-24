import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DevotionDeviation, DevotionPillars } from '@/api/sessions';
import { GradientButton } from '@/components/ui/GradientButton';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { colors, spacing } from '@/theme';

interface ScoreBreakdownSheetProps {
  visible: boolean;
  score: number;
  pillars: DevotionPillars | null;
  deviations: DevotionDeviation[] | null;
  onClose: () => void;
}

type PillarKey = keyof DevotionPillars;

const PILLAR_ROWS: {
  key: PillarKey;
  label: string;
  desc: string;
  icon: SymbolViewProps['name'];
}[] = [
  { key: 'EC', label: 'Exercises', desc: 'Did you cover the planned movements?', icon: 'checklist' },
  { key: 'SC', label: 'Sets', desc: 'How much of the planned work you did.', icon: 'square.stack.3d.up' },
  { key: 'RF', label: 'Reps', desc: 'How close to your target reps.', icon: 'scope' },
  { key: 'LF', label: 'Weight', desc: 'Going heavier is never penalized.', icon: 'dumbbell' },
];

const DEVIATION_CHIP: Record<DevotionDeviation['type'], string> = {
  missed_sets: 'Sets',
  rep_variance: 'Reps',
  load_variance: 'Weight',
  missed_exercise: 'Exercises',
};

export function ScoreBreakdownSheet({
  visible,
  score,
  pillars,
  deviations,
  onClose,
}: ScoreBreakdownSheetProps) {
  const reduceMotion = useReduceMotion();
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      slide.setValue(0);
      return;
    }
    slide.setValue(1);
    Animated.timing(slide, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, reduceMotion, slide]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 600] });

  // The single lagging pillar (lowest available score below 100) gets the amber treatment.
  const present = PILLAR_ROWS.map((row) => ({ row, value: pillars?.[row.key] }))
    .filter((p): p is { row: (typeof PILLAR_ROWS)[number]; value: number } => p.value != null);
  const lowest = present.reduce<{ key: PillarKey; value: number } | null>((min, p) => {
    const pct = Math.round(p.value * 100);
    if (pct >= 100) return min;
    return !min || pct < min.value ? { key: p.row.key, value: pct } : min;
  }, null);

  const topDeviation = deviations?.[0] ?? null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>How it scored</Text>
              <Text style={styles.subtitle}>
                Technical breakdown of your <Text style={styles.subtitleStrong}>{score} / 100</Text>
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <SymbolView name="xmark" size={14} weight="bold" tintColor={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>WHAT WE MEASURE</Text>
          <View style={styles.rows}>
            {PILLAR_ROWS.map(({ key, label, desc, icon }) => {
              const raw = pillars?.[key];
              const pct = raw != null ? Math.round(raw * 100) : null;
              const amber = lowest?.key === key;
              return (
                <View key={key} style={styles.row}>
                  <View style={[styles.iconBox, amber ? styles.iconBoxAmber : styles.iconBoxLime]}>
                    <SymbolView
                      name={icon}
                      size={17}
                      weight="semibold"
                      tintColor={amber ? colors.amberSubtext : '#65803A'}
                    />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{label}</Text>
                    <Text style={styles.rowDesc}>{desc}</Text>
                  </View>
                  <View style={styles.scoreArea}>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${pct ?? 0}%` },
                          amber ? styles.fillAmber : styles.fillLime,
                        ]}
                      />
                    </View>
                    <Text style={[styles.scoreNum, amber && styles.scoreNumAmber]}>
                      {pct ?? '—'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {topDeviation ? (
            <>
              <Text style={styles.sectionLabel}>KEY DEVIATION</Text>
              <View style={styles.deviation}>
                <View style={styles.deviationDot} />
                <View style={styles.rowText}>
                  <Text style={styles.deviationDesc}>{topDeviation.description}</Text>
                  <View style={styles.deviationMeta}>
                    <View style={styles.deviationChip}>
                      <Text style={styles.deviationChipText}>
                        {DEVIATION_CHIP[topDeviation.type]}
                      </Text>
                    </View>
                    <Text style={styles.deviationImpact}>
                      {Math.round(topDeviation.impact * 100)}% of the gap
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : null}

          <GradientButton
            label="Close"
            variant="cyan"
            onPress={onClose}
            style={styles.closeCta}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17,24,39,0.34)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D7DAE0',
    alignSelf: 'center',
    marginBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#9AA0AC',
  },
  subtitleStrong: {
    color: '#374151',
    fontWeight: '700',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F3F5',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#9AA0AC',
    marginTop: 22,
    marginBottom: 12,
  },
  rows: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxLime: {
    backgroundColor: '#F2FBE0',
  },
  iconBoxAmber: {
    backgroundColor: colors.amberBg,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  rowDesc: {
    fontSize: 12,
    color: '#9AA0AC',
    marginTop: 1,
  },
  scoreArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    width: 46,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EDEFF2',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  fillLime: {
    backgroundColor: colors.foxFitDeep,
  },
  fillAmber: {
    backgroundColor: colors.warning,
  },
  scoreNum: {
    width: 34,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  scoreNumAmber: {
    color: colors.amberSubtext,
  },
  deviation: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.destructiveSoft,
    borderWidth: 1,
    borderColor: '#FBDADA',
    borderRadius: 18,
    padding: 16,
  },
  deviationDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: colors.destructive,
    marginTop: 6,
  },
  deviationDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 19,
  },
  deviationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  deviationChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  deviationChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  deviationImpact: {
    fontSize: 12,
    color: '#9AA0AC',
  },
  closeCta: {
    marginTop: 24,
  },
});
