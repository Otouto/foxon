import { StyleSheet, Text, View } from 'react-native';

import { AnimatedCount } from '@/components/AnimatedCount';
import { Card } from '@/components/Card';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { ProgressionState } from '@/api/types';
import { colors, typography } from '@/theme';
import { FOX_STATE_VISUALS } from '@/theme/foxStates';

interface KeyNumbersProps {
  totalSessions: number;
  weekStreak: number;
  formScore: number;
  state: ProgressionState;
}

export function KeyNumbers({ totalSessions, weekStreak, formScore, state }: KeyNumbersProps) {
  const reduceMotion = useReduceMotion();
  const stateColor = FOX_STATE_VISUALS[state].ring;

  return (
    <Card style={styles.card}>
      <Stat value={totalSessions} label="Sessions" animate={!reduceMotion} />
      <Stat value={weekStreak} label="Week streak" animate={!reduceMotion} />
      <Stat value={formScore} label="Form score" color={stateColor} animate={!reduceMotion} />
    </Card>
  );
}

function Stat({
  value,
  label,
  color = colors.text,
  animate,
}: {
  value: number;
  label: string;
  color?: string;
  animate: boolean;
}) {
  return (
    <View style={styles.stat}>
      <AnimatedCount value={value} animate={animate} style={[styles.value, { color }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    ...typography.caption,
  },
});
