import { SymbolView } from 'expo-symbols';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDashboard } from '@/api/queries';
import { FadeInUp } from '@/components/FadeInUp';
import { FoxHeroCard } from '@/components/dashboard/FoxHeroCard';
import { LastSessionSnapshot } from '@/components/dashboard/LastSessionSnapshot';
import { WeekProgressCard } from '@/components/dashboard/WeekProgressCard';
import { getGreeting } from '@/lib/greeting';
import { colors, spacing, typography } from '@/theme';

export default function DashboardScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useDashboard();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Text style={typography.title}>
            {getGreeting()}, {data?.displayName || 'Athlete'}
          </Text>
          {data && data.weekStreak > 0 ? (
            <View style={styles.whisperRow}>
              <SymbolView name="flame.fill" size={13} tintColor={colors.warning} />
              <Text style={styles.whisper}>
                {data.weekStreak}-week streak
              </Text>
            </View>
          ) : (
            <Text style={typography.subhead}>Ready to train?</Text>
          )}
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator />
          </View>
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
    marginBottom: spacing.xl,
  },
  whisperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  whisper: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cards: {
    gap: spacing.lg,
  },
  centered: {
    paddingVertical: 64,
    alignItems: 'center',
  },
});
