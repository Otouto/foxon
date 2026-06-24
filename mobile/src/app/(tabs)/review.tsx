import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useDeleteSession,
  useExercisesReview,
  useSessionsReview,
  type ExerciseAnalytics,
} from '@/api/review';
import { exerciseHistoryQueryOptions, sessionDetailsQueryOptions } from '@/api/sessions';
import type { SessionReviewData } from '@/api/types';
import { Card } from '@/components/Card';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { ReviewListSkeleton } from '@/components/ui/Skeleton';
import { formatDate, groupSessionsByTime, type SessionGroup } from '@/lib/dateUtils';
import { colors, fonts, gradients, spacing, typography } from '@/theme';

const MILESTONE_SCORE = 95;

export default function ReviewScreen() {
  const [tab, setTab] = useState<0 | 1>(0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Review</Text>
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

type ReviewSession = Omit<SessionReviewData, 'date'> & { date: Date };
type TimelineItem =
  | { kind: 'session'; session: ReviewSession; last: boolean }
  | { kind: 'month'; key: string; title: string; subtitle: string };

function SessionsTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useSessionsReview();
  const deleteSession = useDeleteSession();

  const { weekGroup, items } = useMemo(() => {
    if (!data) return { weekGroup: undefined, items: [] as TimelineItem[] };
    const sessions = data.sessions.map((session) => ({ ...session, date: new Date(session.date) }));
    const groups = groupSessionsByTime(sessions, data.weeklyGoal);
    const week = groups.find((g) => g.type === 'week');

    // Flatten the week + month groups into one continuous spine, inserting a
    // divider whenever a new month begins.
    const flat: TimelineItem[] = [];
    const pushSessions = (list: ReviewSession[]) =>
      list.forEach((session) => flat.push({ kind: 'session', session, last: false }));

    if (week) pushSessions(week.sessions as ReviewSession[]);
    groups
      .filter((g): g is SessionGroup<ReviewSession> => g.type === 'month')
      .forEach((group) => {
        flat.push({
          kind: 'month',
          key: group.key,
          title: group.title,
          subtitle:
            group.summary.intelligentHeader ??
            `${group.summary.totalSessions} session${group.summary.totalSessions !== 1 ? 's' : ''}`,
        });
        pushSessions(group.sessions);
      });

    // Mark the final session so its connecting rail is dropped.
    for (let i = flat.length - 1; i >= 0; i--) {
      const item = flat[i];
      if (item.kind === 'session') {
        item.last = true;
        break;
      }
    }

    return { weekGroup: week, items: flat };
  }, [data]);

  const confirmDelete = (session: ReviewSession) => {
    Alert.alert(
      'Delete Session?',
      `“${session.workoutTitle ?? 'Session'}” will be removed permanently.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSession.mutate(session.id) },
      ]
    );
  };

  if (isLoading) return <ReviewListSkeleton />;

  const weekComplete =
    !!weekGroup?.summary.plannedSessions &&
    weekGroup.summary.totalSessions >= weekGroup.summary.plannedSessions;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
      {items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={typography.subhead}>No sessions yet</Text>
        </View>
      ) : (
        <>
          {weekGroup ? (
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>This week</Text>
              <View style={[styles.weekPill, weekComplete && styles.weekPillDone]}>
                <View style={[styles.weekDot, weekComplete && styles.weekDotDone]} />
                <Text style={[styles.weekPillText, weekComplete && styles.weekPillTextDone]}>
                  {weekGroup.summary.totalSessions} of {weekGroup.summary.plannedSessions ?? 0}
                  {weekComplete ? ' · complete' : ''}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.spine}>
            {items.map((item) =>
              item.kind === 'month' ? (
                <MonthDivider key={item.key} title={item.title} subtitle={item.subtitle} />
              ) : (
                <SessionNode
                  key={item.session.id}
                  session={item.session}
                  last={item.last}
                  onPressIn={() =>
                    queryClient.prefetchQuery(sessionDetailsQueryOptions(item.session.id))
                  }
                  onPress={() => router.push(`/session-details/${item.session.id}`)}
                  onLongPress={() => confirmDelete(item.session)}
                />
              )
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function SessionNode({
  session,
  last,
  onPress,
  onPressIn,
  onLongPress,
}: {
  session: ReviewSession;
  last: boolean;
  onPress: () => void;
  onPressIn: () => void;
  onLongPress: () => void;
}) {
  const score = session.devotionScore ?? null;
  const milestone = score != null && score >= MILESTONE_SCORE;
  const quote = session.vibeLine ?? session.narrative ?? null;

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <ScoreRing size={54} strokeWidth={5} progress={score ?? 0} animate={false}>
          <Text style={styles.nodeScore}>{score ?? '—'}</Text>
        </ScoreRing>
        {!last ? <View style={styles.railLine} /> : null}
      </View>

      <Pressable
        style={styles.cardWrap}
        onPress={onPress}
        onPressIn={onPressIn}
        onLongPress={onLongPress}>
        {({ pressed }) =>
          milestone ? (
            <LinearGradient
              colors={gradients.aurora}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.nodeCard, styles.milestoneCard, pressed && styles.pressed]}>
              <NodeCardBody session={session} quote={quote} milestone />
            </LinearGradient>
          ) : (
            <View style={[styles.nodeCard, styles.plainCard, pressed && styles.pressed]}>
              <NodeCardBody session={session} quote={quote} milestone={false} />
            </View>
          )
        }
      </Pressable>
    </View>
  );
}

function NodeCardBody({
  session,
  quote,
  milestone,
}: {
  session: ReviewSession;
  quote: string | null;
  milestone: boolean;
}) {
  return (
    <>
      <View style={styles.nodeTop}>
        <Text style={styles.nodeTitle} numberOfLines={1}>
          {session.workoutTitle ?? 'Session'}
        </Text>
        <Text style={[styles.nodeDate, milestone && styles.nodeDateMilestone]}>
          {formatDate(session.date)}
        </Text>
      </View>
      {quote ? (
        <Text style={[styles.nodeQuote, milestone && styles.nodeQuoteMilestone]} numberOfLines={2}>
          “{quote}”
        </Text>
      ) : null}
    </>
  );
}

function MonthDivider({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={styles.dividerRailTop} />
        <View style={styles.dividerDot} />
        <View style={styles.railLine} />
      </View>
      <View style={styles.dividerText}>
        <Text style={styles.dividerTitle}>{title}</Text>
        <Text style={styles.dividerSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ExercisesTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useExercisesReview();

  const openHistory = (exercise: ExerciseAnalytics) =>
    router.push(`/exercise-history/${exercise.id}?name=${encodeURIComponent(exercise.name)}`);
  const prefetchHistory = (exercise: ExerciseAnalytics) =>
    queryClient.prefetchQuery(exerciseHistoryQueryOptions(exercise.id));

  if (isLoading) return <ReviewListSkeleton />;

  const active = data?.activeExercises ?? [];
  const archived = data?.archivedExercises ?? [];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
      {active.length === 0 && archived.length === 0 ? (
        <View style={styles.centered}>
          <Text style={typography.subhead}>No exercise data yet</Text>
        </View>
      ) : (
        <>
          {active.length > 0 ? <Text style={styles.sectionLabel}>CURRENT WORKOUTS</Text> : null}
          {active.map((exercise) => (
            <ExerciseAnalyticsCard
              key={exercise.id}
              exercise={exercise}
              onPress={() => openHistory(exercise)}
              onPressIn={() => prefetchHistory(exercise)}
            />
          ))}
          {archived.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>ARCHIVED</Text>
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
  onPressIn,
}: {
  exercise: ExerciseAnalytics;
  onPress: () => void;
  onPressIn?: () => void;
}) {
  const peak = exercise.peakPerformance;
  const dots = exercise.devotionDots;
  const trained = dots.filter(Boolean).length;

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn}>
      {({ pressed }) => (
        <Card style={[styles.exerciseCard, pressed && styles.pressed]}>
          <View style={styles.exerciseTop}>
            <View style={styles.exerciseTitleArea}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              {exercise.muscleGroup ? (
                <Text style={styles.exerciseMuscle}>{exercise.muscleGroup}</Text>
              ) : null}
            </View>
          </View>

          {peak ? (
            <View style={styles.peakRow}>
              <Text style={styles.peakLabel}>PEAK</Text>
              <Text style={styles.peakValue}>
                {peak.isBodyweight ? `${peak.reps} reps` : `${peak.weight}kg × ${peak.reps}`}
              </Text>
            </View>
          ) : null}

          {dots.length > 0 ? (
            <>
              <View style={styles.attendanceHeader}>
                <Text style={styles.attendanceLabel}>WEEKLY ATTENDANCE</Text>
                <Text style={styles.attendanceCount}>
                  {trained} / {dots.length} weeks
                </Text>
              </View>
              <View style={styles.bars}>
                {dots.map((on, index) => (
                  <View
                    key={index}
                    style={[styles.attendanceBar, on ? styles.barTrained : styles.barSkipped]}
                  />
                ))}
              </View>
              <View style={styles.legend}>
                <View style={[styles.legendSwatch, styles.barTrained]} />
                <Text style={styles.legendText}>trained</Text>
                <View style={[styles.legendSwatch, styles.barSkipped, styles.legendGap]} />
                <Text style={styles.legendText}>skipped · last {dots.length} weeks</Text>
              </View>
            </>
          ) : null}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  segments: {
    marginBottom: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  // ── This week header ──
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  weekTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  weekPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.fillMuted,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 11,
  },
  weekPillDone: {
    backgroundColor: '#E9F9EE',
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: colors.textTertiary,
  },
  weekDotDone: {
    backgroundColor: colors.success,
  },
  weekPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  weekPillTextDone: {
    color: '#0A7A52',
  },
  // ── Timeline spine ──
  spine: {
    paddingLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  rail: {
    width: 54,
    alignItems: 'center',
  },
  railLine: {
    width: 2,
    flex: 1,
    minHeight: 8,
    marginTop: 6,
    backgroundColor: '#DADDE3',
  },
  nodeScore: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  cardWrap: {
    flex: 1,
    marginBottom: 14,
  },
  nodeCard: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  plainCard: {
    backgroundColor: colors.card,
    shadowColor: '#141828',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  milestoneCard: {
    borderWidth: 1,
    borderColor: gradients.auroraBorder,
    shadowColor: 'rgba(168,85,247,0.5)',
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  nodeTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  nodeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  nodeDate: {
    fontSize: 12,
    color: '#B3B9C4',
  },
  nodeDateMilestone: {
    color: '#A78BBF',
  },
  nodeQuote: {
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 22,
    color: '#5B6472',
    marginTop: 8,
  },
  nodeQuoteMilestone: {
    color: '#6B4E8A',
  },
  // ── Month divider ──
  dividerRailTop: {
    width: 2,
    height: 14,
    backgroundColor: '#DADDE3',
  },
  dividerDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: '#C5CAD3',
  },
  dividerText: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 14,
  },
  dividerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  dividerSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 1,
  },
  // ── Exercises ──
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textTertiary,
    marginBottom: 14,
    marginTop: spacing.sm,
  },
  exerciseCard: {
    borderRadius: 24,
    marginBottom: 14,
  },
  exerciseTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  exerciseTitleArea: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  exerciseMuscle: {
    fontSize: 12.5,
    color: colors.textTertiary,
    marginTop: 2,
  },
  peakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 12,
  },
  peakLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#B3B9C4',
  },
  peakValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 9,
  },
  attendanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textTertiary,
  },
  attendanceCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3F6212',
  },
  bars: {
    flexDirection: 'row',
    gap: 5,
  },
  attendanceBar: {
    flex: 1,
    height: 26,
    borderRadius: 6,
  },
  barTrained: {
    backgroundColor: colors.foxFitDeep,
  },
  barSkipped: {
    backgroundColor: '#E6E8EC',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 9,
  },
  legendSwatch: {
    width: 9,
    height: 9,
    borderRadius: 3,
  },
  legendGap: {
    marginLeft: 8,
  },
  legendText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
});
