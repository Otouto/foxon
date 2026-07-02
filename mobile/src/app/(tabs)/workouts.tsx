import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { WorkoutListItem } from '@shared/types/workout';

import { useWorkouts, workoutPreloadQueryOptions, workoutQueryOptions } from '@/api/queries';
import { queryClient } from '@/api/queryClient';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { GradientButton } from '@/components/ui/GradientButton';
import { WorkoutsSkeleton } from '@/components/ui/Skeleton';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { colors, gradients, spacing, typography } from '@/theme';

const SECTION_TITLES: Record<string, string> = {
  ACTIVE: 'Active',
  DRAFT: 'Drafts',
  ARCHIVED: 'Archived',
};

export default function WorkoutsScreen() {
  const router = useRouter();
  const { triggerHaptic } = useHapticFeedback();
  const { data: workouts, isLoading, refetch, isRefetching } = useWorkouts();

  const sections = useMemo(() => {
    if (!workouts) return [];
    return (['ACTIVE', 'DRAFT', 'ARCHIVED'] as const)
      .map((status) => ({
        title: SECTION_TITLES[status],
        data: workouts.filter((workout) => workout.status === status),
      }))
      .filter((section) => section.data.length > 0);
  }, [workouts]);

  return (
    <View style={styles.root}>
      <AmbientGlow
        color="rgba(163,230,53,0.2)"
        width={340}
        height={300}
        style={{ top: -100, right: -80 }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
          ListHeaderComponent={
            <View style={styles.headerRow}>
              <Text style={styles.screenTitle}>Workouts</Text>
              <Pressable
                style={({ pressed }) => [styles.newExercise, pressed && styles.pressed]}
                onPress={() => router.push('/exercise/create')}>
                <SymbolView name="plus" size={13} weight="bold" tintColor={colors.textSecondary} />
                <Text style={styles.newExerciseLabel}>New exercise</Text>
              </Pressable>
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <WorkoutsSkeleton />
            ) : (
              <View style={styles.centered}>
                <Text style={typography.subhead}>No workouts yet</Text>
              </View>
            )
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onPressInOverview={() => {
                void queryClient.prefetchQuery(workoutQueryOptions(item.id));
              }}
              onOpenOverview={() => {
                triggerHaptic('light');
                router.push(`/workout/${item.id}`);
              }}
              onPressInStart={() => {
                void queryClient.prefetchQuery(workoutPreloadQueryOptions(item.id));
              }}
              onStartSession={() => {
                triggerHaptic('medium');
                router.push(`/session/log?workoutId=${item.id}`);
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          SectionSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListFooterComponent={
            sections.length > 0 ? (
              <GradientButton
                label="Create new workout"
                variant="cyan"
                icon="plus"
                iconPlacement="leading"
                onPress={() => router.push('/workout/create')}
                style={styles.createButton}
              />
            ) : null
          }
          stickySectionHeadersEnabled={false}
        />
      </SafeAreaView>
    </View>
  );
}

function WorkoutCard({
  workout,
  onPressInOverview,
  onOpenOverview,
  onPressInStart,
  onStartSession,
}: {
  workout: WorkoutListItem;
  onPressInOverview: () => void;
  onOpenOverview: () => void;
  onPressInStart: () => void;
  onStartSession: () => void;
}) {
  return (
    <View style={styles.card}>
      <Pressable
        onPressIn={onPressInOverview}
        onPress={onOpenOverview}
        accessibilityRole="button"
        accessibilityLabel={`Open ${workout.title} overview`}
        style={({ pressed }) => [styles.cardText, pressed && styles.pressed]}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {workout.title}
        </Text>
        <Text style={styles.cardMeta}>
          {workout.exerciseCount} exercise{workout.exerciseCount !== 1 ? 's' : ''} · ~
          {workout.estimatedDuration} min
        </Text>
      </Pressable>
      <Pressable
        onPressIn={onPressInStart}
        onPress={onStartSession}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Start ${workout.title} now`}
        style={({ pressed }) => pressed && styles.pressed}>
        <LinearGradient
          colors={gradients.lime}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.play}>
          <SymbolView name="play.fill" size={22} tintColor={colors.onLime} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  newExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  newExerciseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 26,
    padding: 20,
    shadowColor: '#141828',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 3,
  },
  play: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(132,204,22,0.65)',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  createButton: {
    marginTop: spacing.xl,
  },
  pressed: {
    opacity: 0.8,
  },
  centered: {
    paddingVertical: 64,
    alignItems: 'center',
  },
});
