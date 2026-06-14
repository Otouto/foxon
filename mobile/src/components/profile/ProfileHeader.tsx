import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { ProgressionState } from '@/api/types';
import { colors, radius, spacing, typography } from '@/theme';
import { FOX_STATE_VISUALS } from '@/theme/foxStates';

interface ProfileHeaderProps {
  displayName: string | null;
  firstSessionDate: string | null;
  state: ProgressionState;
}

export function ProfileHeader({ displayName, firstSessionDate, state }: ProfileHeaderProps) {
  const router = useRouter();
  const { triggerHaptic } = useHapticFeedback();
  const visual = FOX_STATE_VISUALS[state];

  const trainingSince = firstSessionDate
    ? new Date(firstSessionDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Text style={typography.largeTitle}>{displayName || 'Athlete'}</Text>
        {trainingSince ? (
          <Text style={[typography.subhead, styles.since]}>Training since {trainingSince}</Text>
        ) : null}
        <View style={styles.pill}>
          <Text style={[styles.pillText, { color: visual.ring }]}>{visual.label}</Text>
        </View>
      </View>
      <Pressable
        onPress={() => {
          triggerHaptic('light');
          router.push('/profile-settings');
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        style={({ pressed }) => [styles.gear, pressed && styles.pressed]}>
        <SymbolView name="gearshape" size={24} tintColor={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
  },
  since: {
    marginTop: 2,
  },
  pill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.fillMuted,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gear: {
    padding: spacing.xs,
  },
  pressed: {
    opacity: 0.5,
  },
});
