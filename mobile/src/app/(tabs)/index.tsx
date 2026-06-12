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
import { FoxStateCard } from '@/components/dashboard/FoxStateCard';
import { LastSessionSnapshot } from '@/components/dashboard/LastSessionSnapshot';
import { WeekProgressCard } from '@/components/dashboard/WeekProgressCard';
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
            Hey, {data?.displayName || 'Athlete'}!
          </Text>
          <Text style={typography.subhead}>Ready to train?</Text>
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
            <FoxStateCard
              state={data.foxState.state}
              formScore={data.foxState.formScore}
              formScoreBreakdown={data.foxState.formScoreBreakdown}
            />
            <WeekProgressCard
              completed={data.weekProgress.completed}
              planned={data.weekProgress.planned}
              isComplete={data.weekProgress.isComplete}
              isExceeded={data.weekProgress.isExceeded}
              extra={data.weekProgress.extra}
            />
            {data.lastSession && <LastSessionSnapshot session={data.lastSession} />}
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
  cards: {
    gap: spacing.lg,
  },
  centered: {
    paddingVertical: 64,
    alignItems: 'center',
  },
});
