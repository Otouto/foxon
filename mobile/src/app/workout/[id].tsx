import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { WorkoutItem } from '@shared/types/workout';

import { useWorkout } from '@/api/queries';
import { Card } from '@/components/Card';
import { colors, radius, spacing, typography } from '@/theme';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: workout, isLoading } = useWorkout(id);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: workout?.title ?? 'Workout',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic">
        {isLoading || !workout ? (
          <View style={styles.centered}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <View style={styles.summary}>
              {workout.description ? (
                <Text style={typography.subhead}>{workout.description}</Text>
              ) : null}
              <Text style={styles.meta}>
                {workout.exerciseCount} exercise{workout.exerciseCount !== 1 ? 's' : ''} · ~
                {workout.estimatedDuration} min
              </Text>
            </View>

            <View style={styles.items}>
              {workout.items.map((item) => (
                <ExerciseCard key={item.id} item={item} />
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
              onPress={() => router.push(`/session/log?workoutId=${workout.id}`)}>
              <Text style={styles.startLabel}>Start Session</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </>
  );
}

function ExerciseCard({ item }: { item: WorkoutItem }) {
  return (
    <Card>
      <Text style={typography.headline}>{item.exercise.name}</Text>
      {item.exercise.muscleGroup ? (
        <Text style={styles.muscleGroup}>{item.exercise.muscleGroup.name}</Text>
      ) : null}
      <View style={styles.sets}>
        {item.sets.map((set, index) => (
          <View key={set.id} style={styles.setRow}>
            <Text style={styles.setIndex}>
              {set.type === 'WARMUP' ? 'W' : index + 1 - item.sets.filter(
                (s, i) => i < index && s.type === 'WARMUP'
              ).length}
            </Text>
            <Text style={styles.setDetail}>
              {set.targetLoad} kg × {set.targetReps}
            </Text>
            {set.notes ? <Text style={typography.caption}>{set.notes}</Text> : null}
          </View>
        ))}
      </View>
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
    </Card>
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
  },
  summary: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  meta: {
    ...typography.footnote,
  },
  items: {
    gap: spacing.md,
  },
  muscleGroup: {
    ...typography.footnote,
    marginTop: 2,
  },
  sets: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  setIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.fillMuted,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    overflow: 'hidden',
  },
  setDetail: {
    ...typography.body,
  },
  notes: {
    ...typography.footnote,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  startButton: {
    backgroundColor: colors.tint,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  pressed: {
    opacity: 0.8,
  },
  startLabel: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '600',
  },
});
