import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/theme';

interface WeekProgressCardProps {
  completed: number;
  planned: number;
  isComplete: boolean;
  isExceeded?: boolean;
  extra?: number;
}

export function WeekProgressCard({
  completed,
  planned,
  isComplete,
  isExceeded,
  extra,
}: WeekProgressCardProps) {
  const percentage = Math.min(100, (completed / planned) * 100);
  const remaining = planned - completed;

  const statusMessage = (() => {
    if (completed === 0) return "Let's get moving";
    if (isExceeded && extra) return `Week complete! 🎉 (+${extra})`;
    if (isComplete) return 'Week complete! 🎉';
    return `${remaining} more workout${remaining !== 1 ? 's' : ''} to level up! 🚀`;
  })();

  return (
    <Card>
      <Text style={typography.headline}>This Week</Text>
      <View style={styles.statsRow}>
        <Text style={typography.subhead}>Progress</Text>
        <Text style={styles.statsValue}>
          {completed} of {planned} workouts
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.status}>{statusMessage}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fillMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  status: {
    ...typography.footnote,
    marginTop: spacing.sm,
  },
});
