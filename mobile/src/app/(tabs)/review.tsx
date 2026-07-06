import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  LayoutAnimation,
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
import { exerciseHistoryQueryOptions, sessionDetailsQueryOptions } from '@/api/sessions';
import { Card } from '@/components/Card';
import { GroupHeader } from '@/components/review/GroupHeader';
import { getGlowTier, type GlowTier } from '@/components/review/glowTiers';
import { RestDayConnector } from '@/components/review/RestDayConnector';
import {
  buildTimeline,
  type ConnectorInfo,
  type ReviewSession,
  type TimelineEntry,
} from '@/components/review/timeline';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { ReviewListSkeleton } from '@/components/ui/Skeleton';
import { SoulSegmentedControl, type SegmentOption } from '@/components/ui/SoulSegmentedControl';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { formatDate, groupSessionsByTime } from '@/lib/dateUtils';
import { loadCollapsedGroups, saveCollapsedGroups } from '@/lib/uiPrefs';
import { colors, fonts, gradients, spacing, typography } from '@/theme';

const SEGMENTS: readonly SegmentOption[] = [
  { key: 'sessions', label: 'Sessions', icon: 'calendar' },
  { key: 'exercises', label: 'Exercises', icon: 'chart.line.uptrend.xyaxis' },
];

export default function ReviewScreen() {
  const [tab, setTab] = useState<0 | 1>(0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Review</Text>
        <SoulSegmentedControl
          options={SEGMENTS}
          selectedIndex={tab}
          onChange={(index) => setTab(index as 0 | 1)}
        />
      </View>
      {tab === 0 ? <SessionsTab /> : <ExercisesTab />}
    </SafeAreaView>
  );
}

function SessionsTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { triggerHaptic } = useHapticFeedback();
  const { data, isLoading, refetch } = useSessionsReview();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  const deleteSession = useDeleteSession();

  // MMKV is synchronous, so lazy init paints the persisted fold state on
  // first render — no flash of expanded groups.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => loadCollapsedGroups());

  const items = useMemo(() => {
    if (!data) return [] as TimelineEntry[];
    const sessions = data.sessions.map((session) => ({ ...session, date: new Date(session.date) }));
    return buildTimeline(groupSessionsByTime(sessions, data.weeklyGoal), collapsed);
  }, [data, collapsed]);

  const toggleGroup = (groupKey: string) => {
    triggerHaptic('light');
    // Rows glide as collapsed groups leave the data array (FoxHeroCard
    // pattern). If this misbehaves with the virtualized list under Fabric,
    // switch to reanimated's Animated.FlatList + itemLayoutAnimation.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      saveCollapsedGroups(next);
      return next;
    });
  };

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

  // Virtualized: full training history in a ScrollView made every node mount
  // at once; FlatList only renders what's on screen.
  return (
    <FlatList
      data={items}
      keyExtractor={(item) =>
        item.kind === 'header' ? `header:${item.groupKey}` : item.activity.session.id
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={typography.subhead}>No sessions yet</Text>
        </View>
      }
      renderItem={({ item }) =>
        item.kind === 'header' ? (
          <GroupHeader
            title={item.title}
            groupType={item.groupType}
            summary={item.summary}
            collapsed={collapsed.has(item.groupKey)}
            collapsible={item.summary.totalSessions > 0}
            onToggle={() => toggleGroup(item.groupKey)}
          />
        ) : (
          <SessionNode
            session={item.activity.session}
            connector={item.connector}
            onPressIn={() =>
              queryClient.prefetchQuery(sessionDetailsQueryOptions(item.activity.session.id))
            }
            onPress={() =>
              router.push(
                isUnsealed(item.activity.session)
                  ? `/session/seal/${item.activity.session.id}`
                  : `/session-details/${item.activity.session.id}`
              )
            }
            onLongPress={() => confirmDelete(item.activity.session)}
          />
        )
      }
    />
  );
}

/**
 * Watch-logged sessions arrive without effort/vibe (no keyboard on the wrist);
 * they stay "unsealed" until captured on the phone.
 */
function isUnsealed(session: ReviewSession): boolean {
  return session.status === 'FINISHED' && !session.vibeLine && !session.effort;
}

/**
 * Gentle breathing loop for high-devotion score rings (FoxHeroCard pattern).
 * Card shadows stay static — animating shadow props inside a list is a
 * per-frame style churn; the ring carries the life instead.
 */
function usePulse(active: boolean, amplitude: number) {
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || reduceMotion) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [active, reduceMotion, pulse]);

  return pulse.interpolate({ inputRange: [0, 1], outputRange: [1, amplitude] });
}

function SessionNode({
  session,
  connector,
  onPress,
  onPressIn,
  onLongPress,
}: {
  session: ReviewSession;
  connector: ConnectorInfo | null;
  onPress: () => void;
  onPressIn: () => void;
  onLongPress: () => void;
}) {
  const score = session.devotionScore ?? null;
  const tier = getGlowTier(score);
  const quote = session.vibeLine ?? session.narrative ?? null;
  const scale = usePulse(tier === 'intense' || tier === 'perfect', tier === 'perfect' ? 1.05 : 1.03);

  return (
    <>
      <Pressable
        style={!connector && styles.lastInGroup}
        onPress={onPress}
        onPressIn={onPressIn}
        onLongPress={onLongPress}>
        {({ pressed }) => (
          <NodeCard session={session} quote={quote} tier={tier} pressed={pressed} scale={scale} />
        )}
      </Pressable>
      {connector ? <RestDayConnector connector={connector} /> : null}
    </>
  );
}

function NodeCard({
  session,
  quote,
  tier,
  pressed,
  scale,
}: {
  session: ReviewSession;
  quote: string | null;
  tier: GlowTier;
  pressed: boolean;
  scale: Animated.AnimatedInterpolation<number>;
}) {
  const body = <NodeCardBody session={session} quote={quote} tier={tier} scale={scale} />;

  switch (tier) {
    case 'perfect':
      // Two nested views to get a dual gold + purple halo (one shadow per view).
      return (
        <View style={[styles.perfectHalo, pressed && styles.pressed]}>
          <LinearGradient
            colors={['#FFFBF5', '#FEF5FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.nodeCard, styles.perfectCard]}>
            {body}
          </LinearGradient>
        </View>
      );
    case 'intense':
      return (
        <LinearGradient
          colors={gradients.aurora}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.nodeCard, styles.milestoneCard, pressed && styles.pressed]}>
          {body}
        </LinearGradient>
      );
    case 'glow':
      return (
        <View style={[styles.nodeCard, styles.plainCard, styles.glowCard, pressed && styles.pressed]}>
          {body}
        </View>
      );
    default:
      return (
        <View style={[styles.nodeCard, styles.plainCard, pressed && styles.pressed]}>{body}</View>
      );
  }
}

function NodeCardBody({
  session,
  quote,
  tier,
  scale,
}: {
  session: ReviewSession;
  quote: string | null;
  tier: GlowTier;
  scale: Animated.AnimatedInterpolation<number>;
}) {
  const milestone = tier === 'intense' || tier === 'perfect';
  const score = session.devotionScore ?? null;
  const reduceMotion = useReduceMotion();

  return (
    <View style={styles.cardRow}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <ScoreRing size={54} strokeWidth={5} progress={score ?? 0} animate={!reduceMotion}>
          <Text style={styles.nodeScore}>{score ?? '—'}</Text>
        </ScoreRing>
      </Animated.View>
      <View style={styles.cardBody}>
        <View style={styles.nodeTop}>
          <Text style={styles.nodeTitle} numberOfLines={1}>
            {session.workoutTitle ?? 'Session'}
          </Text>
          <View style={styles.nodeDateWrap}>
            {tier === 'perfect' ? (
              <SymbolView name="sparkles" size={12} tintColor={colors.amberIcon} />
            ) : null}
            <Text style={[styles.nodeDate, milestone && styles.nodeDateMilestone]}>
              {formatDate(session.date)}
            </Text>
          </View>
        </View>
        {quote ? (
          <Text
            style={[styles.nodeQuote, milestone && styles.nodeQuoteMilestone]}
            numberOfLines={2}>
            “{quote}”
          </Text>
        ) : isUnsealed(session) ? (
          <View style={styles.unsealedRow}>
            <SymbolView name="applewatch" size={13} tintColor={colors.amberIcon} />
            <Text style={styles.unsealedText}>Unsealed — add your reflection</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ExercisesTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useExercisesReview();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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
  // ── Timeline ──
  lastInGroup: {
    marginBottom: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardBody: {
    flex: 1,
  },
  nodeScore: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  nodeCard: {
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  plainCard: {
    backgroundColor: colors.card,
    shadowColor: '#141828',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  // Devotion glow tiers (see glowTiers.ts) — aurora palette, one shadow per view.
  glowCard: {
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
    shadowColor: colors.foxFieryDeep,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  milestoneCard: {
    borderWidth: 1,
    borderColor: gradients.auroraBorder,
    shadowColor: colors.foxFieryDeep,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  perfectHalo: {
    borderRadius: 22,
    backgroundColor: '#FFFBF5',
    shadowColor: '#FBBF24',
    shadowOpacity: 0.3,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 4 },
  },
  perfectCard: {
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    shadowColor: colors.foxFieryDeep,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
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
  nodeDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  unsealedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  unsealedText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.amberText,
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
