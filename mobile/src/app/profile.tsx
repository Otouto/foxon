import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
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
import { Card } from '@/components/Card';
import { FadeInUp } from '@/components/FadeInUp';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { ChronicleCard } from '@/components/profile/ChronicleCard';
import { FoxEvolution } from '@/components/profile/FoxEvolution';
import { KeyNumbers } from '@/components/profile/KeyNumbers';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { TrainingPulse } from '@/components/profile/TrainingPulse';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { colors, spacing, typography } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { triggerHaptic } = useHapticFeedback();
  const { data, isLoading, refetch, isRefetching } = useProfile();

  const confirmSignOut = () => {
    Alert.alert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (isLoading || !data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  const { user, stats, firstSessionDate, trainingPulse, chronicleEntry } = data;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
        <FadeInUp>
          <ProfileHeader
            displayName={user.displayName}
            firstSessionDate={firstSessionDate}
            state={user.foxLevel}
          />
        </FadeInUp>

        <View style={styles.sections}>
          <FadeInUp delay={60}>
            <FoxEvolution state={user.foxLevel} formScore={user.foxFormScore} />
          </FadeInUp>

          <FadeInUp delay={130}>
            <TrainingPulse
              grid={trainingPulse.grid}
              totalSessions={trainingPulse.totalSessions}
              weekStreak={trainingPulse.weekStreak}
            />
          </FadeInUp>

          <FadeInUp delay={200}>
            <KeyNumbers
              totalSessions={stats.completedSessions}
              weekStreak={stats.currentWeekStreak}
              formScore={user.foxFormScore}
              state={user.foxLevel}
            />
          </FadeInUp>

          <FadeInUp delay={270}>
            <ChronicleCard entry={chronicleEntry} />
          </FadeInUp>

          <FadeInUp delay={330}>
            <Card style={styles.settingsGroup}>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  router.push('/profile-settings');
                }}
                style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}>
                <Text style={typography.body}>Weekly goal</Text>
                <View style={styles.settingsRight}>
                  <Text style={typography.subhead}>
                    {user.weeklyGoal} workout{user.weeklyGoal !== 1 ? 's' : ''}
                  </Text>
                  <SymbolView name="chevron.right" size={14} tintColor={colors.textTertiary} />
                </View>
              </Pressable>

              <View style={styles.separator} />

              <Pressable
                onPress={confirmSignOut}
                style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}>
                <Text style={[typography.body, { color: colors.destructive }]}>Sign Out</Text>
              </Pressable>
            </Card>
          </FadeInUp>
        </View>
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
  sections: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  settingsGroup: {
    paddingVertical: spacing.xs,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
  pressed: {
    opacity: 0.6,
  },
});
