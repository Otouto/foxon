import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useDeleteSession,
  useExercisesReview,
  useSessionsReview,
  type ExerciseAnalytics,
} from '@/api/review';
import type { SessionReviewData } from '@/api/types';
import { Card } from '@/components/Card';
import { formatDate, groupSessionsByTime } from '@/lib/dateUtils';
import { formatDuration } from '@/lib/exerciseUtils';
import { colors, radius, spacing, typography } from '@/theme';

export default function ReviewScreen() {
  const [tab, setTab] = useState<0 | 1>(0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={typography.title}>Review</Text>
        <SegmentedControl
          values={['Sessions', 'Exercises']}
          selectedIndex={tab}
          onChange={(event) => setTab(event.nativeEvent.selectedSegmentIndex as 0 | 1)}
          style={styles.segments}
        />
      </View>
      {tab === 0 ? <SessionsTab /> : <ExercisesTab />}
    </SafeAreaView>
  );
}

function SessionsTab() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useSessionsReview();
  const deleteSession = useDeleteSession();

  const groups = useMemo(() => {
    if (!data) return [];
    const sessions = data.sessions.map((session) => ({
      ...session,
      date: new Date(session.date),
    }));
    return groupSessionsByTime(sessions, data.weeklyGoal);
  }, [data]);

  const confirmDelete = (session: { id: string; workoutTitle: string | null }) => {
    Alert.alert(
      'Delete Session?',
      `“${session.workoutTitle ?? 'Session'}” will be removed permanently.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSession.mutate(session.id),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
      {groups.length === 0 ? (
        <View style={styles.centered}>
          <Text style={typography.subhead}>No sessions yet</Text>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.summary.intelligentHeader ? (
                <Text style={typography.footnote}>{group.summary.intelligentHeader}</Text>
              ) : (
                <Text style={typography.footnote}>
                  {group.summary.totalSessions} session
                  {group.summary.totalSessions !== 1 ? 's' : ''}
                  {group.summary.averageDevotion
                    ? ` · avg ${Math.round(group.summary.averageDevotion)}`
                    : ''}
                </Text>
              )}
            </View>
            <View style={styles.groupCards}>
              {group.sessions.map((session) => (
                <Pressable
                  key={session.id}
                  onPress={() => router.push(`/session-details/${session.id}`)}
                  onLongPress={() => confirmDelete(session)}>
                  {({ pressed }) => (
                    <View style={pressed ? styles.pressedCard : undefined}>
                      <SessionReviewCard session={session} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function SessionReviewCard({
  session,
}: {
  session: Omit<SessionReviewData, 'date'> & { date: Date };
}) {
  return (
    <Card>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleArea}>
          <Text style={typography.headline} numberOfLines={1}>
            {session.workoutTitle ?? 'Session'}
          </Text>
          <Text style={typography.footnote}>
            {formatDate(session.date)}
            {session.duration ? ` · ${formatDuration(session.duration)}` : ''}
          </Text>
        </View>
        {session.devotionScore != null && (
          <Text style={styles.cardScore}>{session.devotionScore}</Text>
        )}
      </View>
      {session.vibeLine ? (
        <Text style={styles.vibe} numberOfLines={2}>
          “{session.vibeLine}”
        </Text>
      ) : null}
      {session.narrative ? (
        <Text style={typography.footnote} numberOfLines={2}>
          {session.narrative}
        </Text>
      ) : null}
    </Card>
  );
}

function ExercisesTab() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useExercisesReview();

  const openHistory = (exercise: ExerciseAnalytics) =>
    router.push(`/exercise-history/${exercise.id}?name=${encodeURIComponent(exercise.name)}`);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  const active = data?.activeExercises ?? [];
  const archived = data?.archivedExercises ?? [];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
      {active.length === 0 && archived.length === 0 ? (
        <View style={styles.centered}>
          <Text style={typography.subhead}>No exercise data yet</Text>
        </View>
      ) : (
        <>
          {active.map((exercise) => (
            <ExerciseAnalyticsCard
              key={exercise.id}
              exercise={exercise}
              onPress={() => openHistory(exercise)}
            />
          ))}
          {archived.length > 0 ? (
            <>
              <Text style={styles.groupTitle}>Archived</Text>
              {archived.map((exercise) => (
                <ExerciseAnalyticsCard
                  key={exercise.id}
                  exercise={exercise}
                  onPress={() => openHistory(exercise)}
                />
              ))}
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function ExerciseAnalyticsCard({
  exercise,
  onPress,
}: {
  exercise: ExerciseAnalytics;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={pressed ? styles.pressedCard : undefined}>
          <ExerciseAnalyticsCardContent exercise={exercise} />
        </View>
      )}
    </Pressable>
  );
}

function ExerciseAnalyticsCardContent({ exercise }: { exercise: ExerciseAnalytics }) {
  return (
    <Card>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleArea}>
          <Text style={typography.headline}>{exercise.name}</Text>
          {exercise.muscleGroup ? (
            <Text style={typography.footnote}>{exercise.muscleGroup}</Text>
          ) : null}
        </View>
        {exercise.peakPerformance ? (
          <Text style={styles.peak}>
            {exercise.peakPerformance.isBodyweight
              ? `${exercise.peakPerformance.reps} reps`
              : `${exercise.peakPerformance.weight}×${exercise.peakPerformance.reps}`}
          </Text>
        ) : null}
      </View>
      <View style={styles.dots}>
        {exercise.devotionDots.map((active, index) => (
          <View
            key={index}
            style={[styles.dot, { backgroundColor: active ? colors.foxFit : colors.fillMuted }]}
          />
        ))}
        <Text style={styles.consistency}>{Math.round(exercise.consistency * 100)}%</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  segments: {
    marginBottom: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  centered: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  group: {
    gap: spacing.md,
  },
  groupHeader: {
    gap: 2,
  },
  groupTitle: {
    ...typography.headline,
  },
  groupCards: {
    gap: spacing.md,
  },
  pressedCard: {
    opacity: 0.7,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardTitleArea: {
    flex: 1,
    gap: 2,
  },
  cardScore: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  vibe: {
    ...typography.subhead,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  peak: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  consistency: {
    ...typography.caption,
    marginLeft: spacing.sm,
  },
});
