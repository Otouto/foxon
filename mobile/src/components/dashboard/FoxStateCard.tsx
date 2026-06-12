import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import type { ProgressionState } from '@/api/types';
import { colors, spacing, typography } from '@/theme';

const FOX_STATE_STYLES: Record<
  ProgressionState,
  { label: string; bubbleColor: string; size: number; emojiSize: number; barColor: string }
> = {
  SLIM: { label: 'SLIM', bubbleColor: colors.fill, size: 64, emojiSize: 32, barColor: colors.foxSlim },
  FIT: { label: 'FIT', bubbleColor: colors.foxFit, size: 80, emojiSize: 40, barColor: '#84CC16' },
  STRONG: { label: 'STRONG', bubbleColor: colors.foxStrong, size: 96, emojiSize: 48, barColor: colors.foxStrongDeep },
  FIERY: { label: 'FIERY', bubbleColor: colors.foxFiery, size: 112, emojiSize: 56, barColor: colors.foxFieryDeep },
};

const PILLARS = [
  { key: 'attendance', label: 'Attendance' },
  { key: 'quality', label: 'Quality' },
  { key: 'consistency', label: 'Consistency' },
] as const;

interface FoxStateCardProps {
  state: ProgressionState;
  formScore: number;
  formScoreBreakdown: { attendance: number; quality: number; consistency: number };
}

export function FoxStateCard({ state, formScore, formScoreBreakdown }: FoxStateCardProps) {
  const stateStyle = FOX_STATE_STYLES[state];

  return (
    <Card>
      <View style={styles.header}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: stateStyle.bubbleColor,
              width: stateStyle.size,
              height: stateStyle.size,
              borderRadius: stateStyle.size / 2,
            },
          ]}>
          <Text style={{ fontSize: stateStyle.emojiSize }}>🦊</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.stateLabel}>{stateStyle.label}</Text>
          <Text style={styles.score}>{formScore}</Text>
          <Text style={typography.footnote}>Form score</Text>
        </View>
      </View>

      <View style={styles.pillars}>
        {PILLARS.map(({ key, label }) => (
          <View key={key} style={styles.pillar}>
            <View style={styles.pillarTrack}>
              <View
                style={[
                  styles.pillarFill,
                  {
                    backgroundColor: stateStyle.barColor,
                    width: `${Math.min(100, Math.max(0, formScoreBreakdown[key]))}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.pillarLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  stateLabel: {
    ...typography.footnote,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  score: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
  },
  pillars: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  pillar: {
    flex: 1,
    gap: spacing.xs,
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
  pillarLabel: {
    ...typography.caption,
  },
});
