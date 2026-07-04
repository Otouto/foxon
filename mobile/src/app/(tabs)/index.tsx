import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDashboard } from '@/api/queries';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { FadeInUp } from '@/components/FadeInUp';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { FoxHeroCard } from '@/components/dashboard/FoxHeroCard';
import { LastSessionSnapshot } from '@/components/dashboard/LastSessionSnapshot';
import { WeekProgressCard } from '@/components/dashboard/WeekProgressCard';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { getGreeting } from '@/lib/greeting';
import { colors, fonts, gradients, radius, spacing, typography } from '@/theme';

export default function DashboardScreen() {
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  const router = useRouter();
  const { triggerHaptic } = useHapticFeedback();

  const openProfile = useCallback(() => {
    triggerHaptic('light');
    router.push('/profile');
  }, [router, triggerHaptic]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={gradients.homeWash}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={typography.largeTitle}>{data?.displayName || 'Athlete'}</Text>
            {data && data.weekStreak > 0 ? (
              <View style={styles.streakPill}>
                <SymbolView name="flame.fill" size={13} tintColor={colors.amberIcon} />
                <Text style={styles.streakText}>{data.weekStreak}-week streak</Text>
              </View>
            ) : (
              <Text style={[typography.subhead, styles.readyLine]}>Ready to train?</Text>
            )}
          </View>
          <Pressable
            onPress={openProfile}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            hitSlop={8}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.avatarPressed]}>
            <SymbolView name="person.fill" size={20} tintColor={colors.textSecondary} />
          </Pressable>
        </View>

        {isLoading ? (
          <DashboardSkeleton />
        ) : isError ? (
          <View style={styles.centered}>
            <Text style={typography.subhead}>
              {error instanceof Error ? error.message : 'Could not load dashboard'}
            </Text>
          </View>
        ) : data ? (
          <View style={styles.cards}>
            <FadeInUp delay={60}>
              <FoxHeroCard
                state={data.foxState.state}
                formScore={data.foxState.formScore}
                formScoreBreakdown={data.foxState.formScoreBreakdown}
                hasNoSessions={data.foxState.hasNoSessions}
                timePeriod={data.foxState.timePeriod}
                weeklyGoal={data.weekProgress.planned}
              />
            </FadeInUp>

            <FadeInUp delay={130}>
              <WeekProgressCard
                completed={data.weekProgress.completed}
                planned={data.weekProgress.planned}
                isComplete={data.weekProgress.isComplete}
                isExceeded={data.weekProgress.isExceeded}
                extra={data.weekProgress.extra}
                nextWorkout={data.nextWorkout}
              />
            </FadeInUp>

            {data.lastSession ? (
              <FadeInUp delay={200}>
                <LastSessionSnapshot session={data.lastSession} />
              </FadeInUp>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.serifAccent,
    marginBottom: 2,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.amberSoft,
  },
  streakText: {
    ...typography.footnote,
    color: colors.amberText,
    fontWeight: '600',
  },
  readyLine: {
    marginTop: spacing.xs,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
    marginTop: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  avatarPressed: {
    opacity: 0.6,
  },
  cards: {
    gap: spacing.lg,
  },
  centered: {
    paddingVertical: 64,
    alignItems: 'center',
  },
});
