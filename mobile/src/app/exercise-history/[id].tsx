import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useExerciseHistory, type ExerciseHistoryEntry } from '@/api/sessions';
import { Card } from '@/components/Card';
import { ExerciseHistorySkeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/dateUtils';
import { colors, spacing, typography } from '@/theme';

export default function ExerciseHistoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { data: history, isLoading } = useExerciseHistory(id);

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: name ?? 'Exercise', headerBackTitle: 'Review' }}
      />
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={history ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          history && history.length > 0 ? (
            <Text style={styles.sectionTitle}>Exercise History</Text>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <ExerciseHistorySkeleton />
          ) : (
            <View style={styles.centered}>
              <Text style={typography.headline}>No performance history</Text>
              <Text style={styles.emptyHint}>
                This exercise hasn’t been performed in any sessions yet.
              </Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <HistoryCard
            entry={item}
            onPress={() => router.push(`/session-details/${item.id}`)}
          />
        )}
      />
    </>
  );
}

function HistoryCard({
  entry,
  onPress,
}: {
  entry: ExerciseHistoryEntry;
  onPress: () => void;
}) {
  const completedSets = entry.sessionExercise.sessionSets.filter((set) => set.completed);

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card style={pressed ? styles.pressed : undefined}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={typography.headline}>{formatDate(new Date(entry.date))}</Text>
              {entry.workoutTitle ? (
                <Text style={typography.footnote}>{entry.workoutTitle}</Text>
              ) : null}
            </View>
            {entry.devotionScore != null && (
              <Text style={styles.score}>{entry.devotionScore}</Text>
            )}
          </View>
          <View style={styles.setsRow}>
            {completedSets.length > 0 ? (
              completedSets.map((set) => (
                <View key={set.id} style={styles.setChip}>
                  <Text style={styles.setChipText}>
                    {set.load > 0 ? `${set.load}×${set.reps}` : `${set.reps} reps`}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={typography.footnote}>No completed sets</Text>
            )}
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 48,
  },
  centered: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyHint: {
    ...typography.subhead,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.headline,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  score: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  setsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  setChip: {
    backgroundColor: colors.fillMuted,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  setChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
