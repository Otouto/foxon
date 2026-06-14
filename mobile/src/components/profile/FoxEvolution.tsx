import { Fragment, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Card } from '@/components/Card';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { getNextLevelHint } from '@/lib/foxInsight';
import type { ProgressionState } from '@/api/types';
import { colors, spacing, typography } from '@/theme';
import { FOX_STATES, FOX_STATE_VISUALS, STAGE_DESC, STAGE_EMOJI } from '@/theme/foxStates';

const CURRENT_SIZE = 64;
const STAGE_SIZE = 48;
const SLOT = CURRENT_SIZE;

interface FoxEvolutionProps {
  state: ProgressionState;
  formScore: number;
}

export function FoxEvolution({ state, formScore }: FoxEvolutionProps) {
  const currentIndex = FOX_STATES.indexOf(state);

  return (
    <Card>
      <Text style={styles.heading}>Fox Evolution</Text>

      <View style={styles.path}>
        {FOX_STATES.map((stage, i) => {
          const status: StageStatus =
            i === currentIndex ? 'current' : i < currentIndex ? 'past' : 'future';
          const nextReached = i + 1 <= currentIndex;

          return (
            <Fragment key={stage}>
              <View style={styles.stage}>
                <View style={styles.slot}>
                  <FoxStageCircle stage={stage} status={status} />
                </View>
                <Text style={[styles.label, LABEL_STYLE[status]]}>
                  {capitalize(stage)}
                </Text>
              </View>
              {i < FOX_STATES.length - 1 ? (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: nextReached ? colors.foxFit : colors.separator },
                  ]}
                />
              ) : null}
            </Fragment>
          );
        })}
      </View>

      <Text style={styles.footer}>
        {STAGE_DESC[state]} · {getNextLevelHint(state, formScore)}
      </Text>
    </Card>
  );
}

type StageStatus = 'current' | 'past' | 'future';

function FoxStageCircle({ stage, status }: { stage: ProgressionState; status: StageStatus }) {
  const visual = FOX_STATE_VISUALS[stage];
  const emoji = STAGE_EMOJI[stage];
  const reduceMotion = useReduceMotion();
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status !== 'current' || reduceMotion) return;
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
  }, [status, reduceMotion, breathe]);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  if (status === 'current') {
    return (
      <Animated.View
        style={[
          styles.currentWrap,
          { shadowColor: visual.glow, transform: [{ scale }] },
        ]}>
        <Svg width={CURRENT_SIZE} height={CURRENT_SIZE}>
          <Defs>
            <LinearGradient id={`evo-${stage}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={visual.gradientFrom} />
              <Stop offset="100%" stopColor={visual.gradientTo} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={CURRENT_SIZE / 2}
            cy={CURRENT_SIZE / 2}
            r={CURRENT_SIZE / 2}
            fill={`url(#evo-${stage})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <Text style={styles.currentEmoji}>{emoji}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <View
      style={[
        styles.stageCircle,
        {
          backgroundColor: status === 'past' ? visual.gradientFrom : colors.fillMuted,
        },
      ]}>
      <Text style={status === 'future' ? styles.futureEmoji : styles.stageEmoji}>{emoji}</Text>
    </View>
  );
}

const LABEL_STYLE: Record<StageStatus, { color: string; fontWeight: '400' | '600' }> = {
  current: { color: colors.text, fontWeight: '600' },
  past: { color: colors.textSecondary, fontWeight: '400' },
  future: { color: colors.textTertiary, fontWeight: '400' },
};

function capitalize(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  heading: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  path: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stage: {
    width: CURRENT_SIZE,
    alignItems: 'center',
  },
  slot: {
    height: SLOT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connector: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    marginTop: SLOT / 2 - 1,
    marginHorizontal: 2,
  },
  currentWrap: {
    width: CURRENT_SIZE,
    height: CURRENT_SIZE,
    borderRadius: CURRENT_SIZE / 2,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentEmoji: {
    fontSize: 30,
  },
  stageCircle: {
    width: STAGE_SIZE,
    height: STAGE_SIZE,
    borderRadius: STAGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageEmoji: {
    fontSize: 22,
  },
  futureEmoji: {
    fontSize: 22,
    opacity: 0.3,
  },
  label: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  footer: {
    ...typography.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
