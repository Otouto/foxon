import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { WorkoutItem } from '@shared/types/workout';

import { useWorkout, workoutPreloadQueryOptions } from '@/api/queries';
import { queryClient } from '@/api/queryClient';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { GradientButton } from '@/components/ui/GradientButton';
import { WorkoutDetailSkeleton } from '@/components/ui/Skeleton';
import { colors, spacing, typography } from '@/theme';

type ItemGroup = { blockId: string | null; items: WorkoutItem[] };

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: workout, isLoading } = useWorkout(id);

  // Viewing a workout is strong start-intent: warm the session preload now so
  // tapping "Start" opens the logging screen without a network wait.
  useEffect(() => {
    if (id) void queryClient.prefetchQuery(workoutPreloadQueryOptions(id));
  }, [id]);

  // Group consecutive items that share a blockId into supersets.
  const groups: ItemGroup[] = [];
  for (const item of workout?.items ?? []) {
    const blockId = item.blockId ?? null;
    const last = groups[groups.length - 1];
    if (blockId && last && last.blockId === blockId) last.items.push(item);
    else groups.push({ blockId, items: [item] });
  }
  let supersetCount = 0;

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{ headerShown: true, title: workout?.title ?? 'Workout', headerBackTitle: 'Back' }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic">
        {isLoading || !workout ? (
          <WorkoutDetailSkeleton />
        ) : (
          <>
            {/* Overview hero */}
            <LinearGradient
              colors={['#E6FBFF', '#F2FBE0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}>
              <AmbientGlow
                color="rgba(34,211,238,0.28)"
                width={220}
                height={220}
                style={{ top: -50, right: -30 }}
              />
              <View style={styles.heroHeader}>
                <View style={styles.heroIcon}>
                  <SymbolView name="target" size={24} tintColor={colors.foxStrongDeep} />
                </View>
                <View>
                  <Text style={styles.heroTitle}>Workout overview</Text>
                  {workout.description ? (
                    <Text style={styles.heroSubtitle} numberOfLines={1}>
                      {workout.description}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{workout.exerciseCount}</Text>
                  <Text style={styles.heroStatLabel}>Exercises</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{workout.estimatedDuration}</Text>
                  <Text style={styles.heroStatLabel}>Minutes</Text>
                </View>
              </View>
            </LinearGradient>

            <Text style={styles.sectionLabel}>EXERCISES</Text>

            <View style={styles.groups}>
              {groups.map((group, index) => {
                const isSuperset = group.blockId != null && group.items.length > 1;
                if (isSuperset) {
                  supersetCount += 1;
                  return (
                    <View key={group.blockId ?? index} style={styles.superset}>
                      <View style={styles.supersetHeader}>
                        <SymbolView
                          name="link"
                          size={16}
                          weight="semibold"
                          tintColor="#0891B2"
                        />
                        <Text style={styles.supersetTitle}>Block {supersetCount} · Superset</Text>
                      </View>
                      {group.items.map((item) => (
                        <ExerciseCard key={item.id} item={item} nested />
                      ))}
                    </View>
                  );
                }
                return <ExerciseCard key={group.items[0].id} item={group.items[0]} />;
              })}
            </View>
          </>
        )}
      </ScrollView>

      {workout ? (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <GradientButton
            label={`Start ${workout.title}`}
            variant="lime"
            icon="play.fill"
            iconPlacement="leading"
            onPressIn={() => void queryClient.prefetchQuery(workoutPreloadQueryOptions(workout.id))}
            onPress={() => router.push(`/session/log?workoutId=${workout.id}`)}
          />
        </SafeAreaView>
      ) : null}
    </View>
  );
}

function ExerciseCard({ item, nested }: { item: WorkoutItem; nested?: boolean }) {
  let normalCount = 0;
  return (
    <View style={[styles.exerciseCard, nested && styles.exerciseCardNested]}>
      <View style={styles.exerciseTop}>
        <Text style={styles.exerciseName}>{item.exercise.name}</Text>
        <Text style={styles.exerciseSetCount}>{item.sets.length} sets</Text>
      </View>
      {item.exercise.muscleGroup ? (
        <Text style={styles.muscleGroup}>{item.exercise.muscleGroup.name}</Text>
      ) : null}
      <View style={styles.sets}>
        {item.sets.map((set) => {
          const isWarmup = set.type === 'WARMUP';
          if (!isWarmup) normalCount += 1;
          return (
            <View key={set.id} style={styles.setRow}>
              <Text style={styles.setIndex}>{isWarmup ? 'W' : normalCount}</Text>
              <Text style={styles.setDetail}>
                {set.targetLoad > 0
                  ? `${set.targetReps} reps · ${set.targetLoad} kg`
                  : `${set.targetReps} reps · Bodyweight`}
              </Text>
            </View>
          );
        })}
      </View>
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 24,
  },
  // ── Hero ──
  hero: {
    borderRadius: 28,
    padding: 22,
    overflow: 'hidden',
    shadowColor: 'rgba(6,182,212,0.4)',
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(6,182,212,0.5)',
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E3A44',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#3B8B9C',
    marginTop: 1,
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: 22,
  },
  heroStat: {
    flex: 1,
  },
  heroStatValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0E3A44',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  heroStatLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B8B9C',
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(6,182,212,0.18)',
    marginVertical: 4,
    marginHorizontal: 22,
  },
  // ── Sections ──
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textTertiary,
    marginTop: 22,
    marginBottom: 14,
  },
  groups: {
    gap: spacing.md,
  },
  superset: {
    borderRadius: 26,
    backgroundColor: '#EAF9FD',
    borderWidth: 1.5,
    borderColor: '#CBEEF6',
    padding: 14,
    gap: 10,
  },
  supersetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 2,
  },
  supersetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E6B7D',
  },
  // ── Exercise card ──
  exerciseCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#141828',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  exerciseCardNested: {
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  exerciseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  exerciseSetCount: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  muscleGroup: {
    fontSize: 12.5,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sets: {
    marginTop: 14,
    gap: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F7F8FA',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  setIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E9EBEF',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    overflow: 'hidden',
  },
  setDetail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontVariant: ['tabular-nums'],
  },
  notes: {
    ...typography.footnote,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  // ── Footer CTA ──
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
});
