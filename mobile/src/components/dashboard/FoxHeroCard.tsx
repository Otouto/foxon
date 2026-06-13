import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { AnimatedCount } from '@/components/AnimatedCount';
import { Card } from '@/components/Card';
import { ProgressRing } from '@/components/ProgressRing';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { getFormInsight, getNextLevelHint, PILLAR_INFO, type PillarKey } from '@/lib/foxInsight';
import type { ProgressionState } from '@/api/types';
import { colors, spacing, typography } from '@/theme';
import { FOX_STATE_VISUALS } from '@/theme/foxStates';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RING_SIZE = 168;
const RING_STROKE = 12;
const EMOJI_SIZE = 60;

const PILLAR_KEYS: PillarKey[] = ['attendance', 'quality', 'consistency'];

interface FoxHeroCardProps {
  state: ProgressionState;
  formScore: number;
  formScoreBreakdown: { attendance: number; quality: number; consistency: number };
  hasNoSessions: boolean;
  timePeriod: string;
  weeklyGoal: number;
}

export function FoxHeroCard({
  state,
  formScore,
  formScoreBreakdown,
  hasNoSessions,
  timePeriod,
  weeklyGoal,
}: FoxHeroCardProps) {
  const visual = FOX_STATE_VISUALS[state];
  const reduceMotion = useReduceMotion();
  const { triggerHaptic } = useHapticFeedback();
  const [expanded, setExpanded] = useState(false);

  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [reduceMotion, breathe]);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });

  const toggleExpanded = () => {
    triggerHaptic('light');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <Card style={styles.card}>
      <Animated.View
        style={[
          styles.ringWrap,
          { shadowColor: visual.glow, transform: [{ scale }] },
        ]}>
        <ProgressRing
          size={RING_SIZE}
          strokeWidth={RING_STROKE}
          progress={formScore}
          ringColor={visual.ring}
          trackColor={colors.fillMuted}
          bubbleGradient={[visual.gradientFrom, visual.gradientTo]}
          animate={!reduceMotion}>
          <Text style={{ fontSize: EMOJI_SIZE }}>🦊</Text>
        </ProgressRing>
      </Animated.View>

      <Text style={[typography.title, styles.identity]}>{visual.identity}</Text>

      <AnimatedCount
        value={formScore}
        animate={!reduceMotion}
        style={[styles.score, { color: visual.ring }]}
      />

      <Text style={styles.insight}>
        {getFormInsight(formScoreBreakdown, hasNoSessions)}
      </Text>

      <Pressable
        onPress={toggleExpanded}
        hitSlop={8}
        style={({ pressed }) => [styles.detailsToggle, pressed && styles.pressed]}>
        <Text style={styles.detailsLabel}>{expanded ? 'Hide details' : 'Details'}</Text>
        <SymbolView
          name={expanded ? 'chevron.up' : 'chevron.down'}
          size={12}
          tintColor={colors.textSecondary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          <Text style={styles.detailsHeader}>
            {visual.label} · FORM · {timePeriod.toUpperCase()}
          </Text>
          {PILLAR_KEYS.map((key) => (
            <PillarRow
              key={key}
              pillarKey={key}
              value={formScoreBreakdown[key]}
              color={visual.barColor}
              weeklyGoal={weeklyGoal}
              animate={!reduceMotion}
            />
          ))}
          <Text style={styles.nextHint}>{getNextLevelHint(state, formScore)}</Text>
        </View>
      ) : null}
    </Card>
  );
}

function PillarRow({
  pillarKey,
  value,
  color,
  weeklyGoal,
  animate,
}: {
  pillarKey: PillarKey;
  value: number;
  color: string;
  weeklyGoal: number;
  animate: boolean;
}) {
  const info = PILLAR_INFO[pillarKey];
  const clamped = Math.min(100, Math.max(0, value));
  const widthAnim = useRef(new Animated.Value(animate ? 0 : clamped)).current;

  useEffect(() => {
    if (!animate) {
      widthAnim.setValue(clamped);
      return;
    }
    const animation = Animated.timing(widthAnim, {
      toValue: clamped,
      duration: 700,
      delay: 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, animate, widthAnim]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.pillarRow}>
      <View style={styles.pillarTop}>
        <Text style={styles.pillarName}>{info.label}</Text>
        <Text style={[styles.pillarValue, { color }]}>{value}</Text>
      </View>
      <View style={styles.pillarTrack}>
        <Animated.View style={[styles.pillarFill, { width, backgroundColor: color }]} />
      </View>
      <Text style={styles.pillarCaption}>{info.describe(weeklyGoal)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  ringWrap: {
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  identity: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  score: {
    fontSize: 40,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  insight: {
    ...typography.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
  },
  detailsLabel: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.6,
  },
  details: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
    gap: spacing.lg,
  },
  detailsHeader: {
    ...typography.caption,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  pillarRow: {
    gap: spacing.xs,
  },
  pillarTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  pillarName: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.text,
  },
  pillarValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  pillarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.fillMuted,
    overflow: 'hidden',
  },
  pillarFill: {
    height: '100%',
    borderRadius: 3,
  },
  pillarCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  nextHint: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
