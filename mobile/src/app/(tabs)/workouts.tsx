import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { WorkoutListItem } from '@shared/types/workout';

import { useWorkouts } from '@/api/queries';
import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/theme';

const SECTION_TITLES: Record<string, string> = {
  ACTIVE: 'Workouts',
  DRAFT: 'Drafts',
  ARCHIVED: 'Archived',
};

export default function WorkoutsScreen() {
  const router = useRouter();
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        ListHeaderComponent={<Text style={[typography.title, styles.screenTitle]}>Workouts</Text>}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator />
            </View>
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
          <WorkoutRow workout={item} onPress={() => router.push(`/workout/${item.id}`)} />
        )}
        SectionSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

function WorkoutRow({ workout, onPress }: { workout: WorkoutListItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card style={pressed ? styles.pressed : undefined}>
          <Text style={typography.headline}>{workout.title}</Text>
          {workout.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {workout.description}
            </Text>
          ) : null}
          <Text style={styles.meta}>
            {workout.exerciseCount} exercise{workout.exerciseCount !== 1 ? 's' : ''} · ~
            {workout.estimatedDuration} min
          </Text>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  screenTitle: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    ...typography.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  description: {
    ...typography.subhead,
    marginTop: 2,
  },
  meta: {
    ...typography.footnote,
    marginTop: spacing.sm,
  },
  centered: {
    paddingVertical: 64,
    alignItems: 'center',
  },
});
