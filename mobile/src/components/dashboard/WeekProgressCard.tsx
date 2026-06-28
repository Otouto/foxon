import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { colors, gradients, spacing, typography } from '@/theme';

interface WeekProgressCardProps {
  completed: number;
  planned: number;
  isComplete: boolean;
  isExceeded?: boolean;
  extra?: number;
  nextWorkout: {
    id: string;
    title: string;
    exerciseCount: number;
    estimatedDuration: number;
  } | null;
}

export function WeekProgressCard({
  completed,
  planned,
  isComplete,
  isExceeded,
  extra,
  nextWorkout,
}: WeekProgressCardProps) {
  const percentage = planned > 0 ? Math.min(100, (completed / planned) * 100) : 0;
  const remaining = planned - completed;
  const reduceMotion = useReduceMotion();
  const router = useRouter();
  const { triggerHaptic } = useHapticFeedback();

  const widthAnim = useRef(new Animated.Value(reduceMotion ? percentage : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      widthAnim.setValue(percentage);
      return;
    }
    const animation = Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 700,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [percentage, reduceMotion, widthAnim]);

  const width = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  const statusMessage = (() => {
    if (completed === 0) return "Let's get moving";
    if (isExceeded && extra) return `Week complete! 🎉 (+${extra})`;
    if (isComplete) return 'Week complete! 🎉';
    return `${remaining} more workout${remaining !== 1 ? 's' : ''} to level up! 🚀`;
  })();

  const onStartSession = () => {
    triggerHaptic('medium');
    router.push(`/session/log?workoutId=${nextWorkout!.id}`);
  };

  const onOpenOverview = () => {
    triggerHaptic('light');
    router.push(`/workout/${nextWorkout!.id}`);
  };

  const onBrowseWorkouts = () => {
    triggerHaptic('medium');
    router.push('/workouts');
  };

  return (
    <Card>
      <Text style={typography.headline}>This Week</Text>
      <View style={styles.statsRow}>
        <Text style={typography.subhead}>Progress</Text>
        <Text style={styles.statsValue}>
          {completed} of {planned} workouts
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]}>
          <LinearGradient
            colors={gradients.journey}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={styles.status}>{statusMessage}</Text>

      <View style={styles.divider} />

      {nextWorkout ? (
        <View style={styles.startRow}>
          <Pressable
            onPress={onStartSession}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Start ${nextWorkout.title} now`}
            style={({ pressed }) => pressed && styles.pressed}>
            <LinearGradient
              colors={gradients.journey}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.playCircle}>
              <SymbolView name="play.fill" size={18} tintColor="#FFFFFF" />
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={onOpenOverview}
            accessibilityRole="button"
            accessibilityLabel={`Open ${nextWorkout.title} overview`}
            style={({ pressed }) => [styles.startBody, pressed && styles.pressed]}>
            <Text style={styles.startKicker}>UP NEXT</Text>
            <Text style={styles.startTitle} numberOfLines={1}>
              {nextWorkout.title}
            </Text>
            <Text style={styles.startMeta} numberOfLines={1}>
              {`${nextWorkout.exerciseCount} exercise${nextWorkout.exerciseCount !== 1 ? 's' : ''} · ~${nextWorkout.estimatedDuration} min`}
            </Text>
          </Pressable>
          <SymbolView name="chevron.right" size={15} tintColor={colors.textTertiary} />
        </View>
      ) : (
        <Pressable
          onPress={onBrowseWorkouts}
          accessibilityRole="button"
          accessibilityLabel="Start a workout"
          style={({ pressed }) => [styles.startRow, pressed && styles.pressed]}>
          <LinearGradient
            colors={gradients.journey}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playCircle}>
            <SymbolView name="play.fill" size={18} tintColor="#FFFFFF" />
          </LinearGradient>
          <View style={styles.startBody}>
            <Text style={styles.startKicker}>GET STARTED</Text>
            <Text style={styles.startTitle} numberOfLines={1}>
              Start a workout
            </Text>
            <Text style={styles.startMeta} numberOfLines={1}>
              Pick a program and get moving
            </Text>
          </View>
          <SymbolView name="chevron.right" size={15} tintColor={colors.textTertiary} />
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fillMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  status: {
    ...typography.footnote,
    marginTop: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginVertical: spacing.lg,
  },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBody: {
    flex: 1,
  },
  startKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.foxStrongDeep,
  },
  startTitle: {
    ...typography.headline,
    marginTop: 1,
  },
  startMeta: {
    ...typography.footnote,
    marginTop: 1,
  },
});
