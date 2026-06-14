import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/theme';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKS = 12;

interface TrainingPulseProps {
  grid: boolean[][]; // [day 0-6][week 0-11]
  totalSessions: number;
  weekStreak: number;
}

export function TrainingPulse({ grid, totalSessions, weekStreak }: TrainingPulseProps) {
  const todayDayIdx = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6

  return (
    <Card>
      <Text style={styles.heading}>Training Pulse</Text>
      <Text style={styles.subhead}>Last 12 weeks</Text>

      <View style={styles.grid}>
        {DAY_LABELS.map((label, dayIdx) => (
          <View key={dayIdx} style={styles.row}>
            <Text style={styles.dayLabel}>{label}</Text>
            <View style={styles.cells}>
              {Array.from({ length: WEEKS }, (_, weekIdx) => {
                const trained = grid[dayIdx]?.[weekIdx] ?? false;
                const isToday = weekIdx === WEEKS - 1 && dayIdx === todayDayIdx;
                return (
                  <View
                    key={weekIdx}
                    style={[
                      styles.cell,
                      { backgroundColor: trained ? colors.foxFit : colors.fillMuted },
                      isToday && styles.today,
                    ]}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <SymbolView name="flame.fill" size={13} tintColor={colors.warning} />
        <Text style={styles.footerText}>
          {totalSessions} session{totalSessions !== 1 ? 's' : ''} · {weekStreak}-week streak
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subhead: {
    ...typography.caption,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  grid: {
    gap: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dayLabel: {
    width: 12,
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  cells: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
  },
  today: {
    borderWidth: 1.5,
    borderColor: colors.textTertiary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  footerText: {
    ...typography.footnote,
  },
});
