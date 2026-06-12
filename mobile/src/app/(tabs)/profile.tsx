import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
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

import { useProfile } from '@/api/profile';
import type { ProgressionState } from '@/api/types';
import { Card } from '@/components/Card';
import { colors, radius, spacing, typography } from '@/theme';

const FOX_STATES: ProgressionState[] = ['SLIM', 'FIT', 'STRONG', 'FIERY'];

const STATE_COLORS: Record<ProgressionState, string> = {
  SLIM: colors.foxSlim,
  FIT: colors.foxFit,
  STRONG: colors.foxStrong,
  FIERY: colors.foxFiery,
};

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useProfile();

  const confirmSignOut = () => {
    Alert.alert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (isLoading || !data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  const { user, stats, firstSessionDate, trainingPulse, chronicleEntry } = data;
  const currentStateIndex = FOX_STATES.indexOf(user.foxLevel);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
        {/* Identity */}
        <View style={styles.identity}>
          <Text style={styles.foxEmoji}>🦊</Text>
          <Text style={typography.title}>{user.displayName ?? 'Athlete'}</Text>
          {firstSessionDate ? (
            <Text style={typography.subhead}>
              Training since{' '}
              {new Date(firstSessionDate).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          ) : null}
        </View>

        {/* Fox evolution */}
        <Card>
          <Text style={typography.headline}>Fox Evolution</Text>
          <View style={styles.evolution}>
            {FOX_STATES.map((state, index) => {
              const reached = index <= currentStateIndex;
              return (
                <View key={state} style={styles.evolutionStep}>
                  <View
                    style={[
                      styles.evolutionDot,
                      { backgroundColor: reached ? STATE_COLORS[state] : colors.fillMuted },
                    ]}
                  />
                  <Text
                    style={[
                      styles.evolutionLabel,
                      reached && { color: colors.text, fontWeight: '600' },
                    ]}>
                    {state}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Training pulse */}
        <Card>
          <Text style={typography.headline}>Training Pulse</Text>
          <Text style={typography.footnote}>Last 12 weeks</Text>
          <View style={styles.pulseGrid}>
            {trainingPulse.grid.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.pulseColumn}>
                {week.map((active, dayIndex) => (
                  <View
                    key={dayIndex}
                    style={[
                      styles.pulseCell,
                      { backgroundColor: active ? colors.foxFit : colors.fillMuted },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </Card>

        {/* Key numbers */}
        <View style={styles.numbersRow}>
          <Card style={styles.numberCard}>
            <Text style={styles.numberValue}>{stats.completedSessions}</Text>
            <Text style={typography.caption}>Sessions</Text>
          </Card>
          <Card style={styles.numberCard}>
            <Text style={styles.numberValue}>{stats.currentWeekStreak}</Text>
            <Text style={typography.caption}>Week streak</Text>
          </Card>
          <Card style={styles.numberCard}>
            <Text style={styles.numberValue}>{user.foxFormScore}</Text>
            <Text style={typography.caption}>Form score</Text>
          </Card>
        </View>

        {/* Chronicle */}
        <Pressable onPress={() => router.push('/chronicle')}>
          {({ pressed }) => (
            <Card style={pressed ? styles.pressed : undefined}>
              <Text style={typography.headline}>Fox Chronicle</Text>
              {chronicleEntry.state === 'has_chapter' && chronicleEntry.latestChapter ? (
                <Text style={typography.subhead}>
                  Latest: {chronicleEntry.latestChapter.title}
                </Text>
              ) : (
                <Text style={typography.subhead}>Your monthly training story</Text>
              )}
            </Card>
          )}
        </Pressable>

        {/* Settings & sign out */}
        <Pressable onPress={() => router.push('/profile-settings')}>
          {({ pressed }) => (
            <Card style={pressed ? styles.pressed : undefined}>
              <Text style={typography.headline}>Settings</Text>
              <Text style={typography.subhead}>
                Weekly goal: {user.weeklyGoal} workout{user.weeklyGoal !== 1 ? 's' : ''}
              </Text>
            </Card>
          )}
        </Pressable>

        <Pressable style={styles.signOut} onPress={confirmSignOut}>
          <Text style={styles.signOutLabel}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  identity: {
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.lg,
  },
  foxEmoji: {
    fontSize: 56,
  },
  evolution: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  evolutionStep: {
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  evolutionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  evolutionLabel: {
    ...typography.caption,
  },
  pulseGrid: {
    flexDirection: 'row',
    gap: 3,
    marginTop: spacing.md,
  },
  pulseColumn: {
    gap: 3,
    flex: 1,
  },
  pulseCell: {
    aspectRatio: 1,
    borderRadius: 3,
  },
  numbersRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  numberCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  numberValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.7,
  },
  signOut: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  signOutLabel: {
    ...typography.body,
    color: colors.destructive,
  },
});
