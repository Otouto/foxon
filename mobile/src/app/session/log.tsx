import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionExerciseCard } from '@/components/session/SessionExerciseCard';
import { useInMemorySession } from '@/hooks/useInMemorySession';
import { formatDuration, hasBodyweightSets, isBodyweightExercise } from '@/lib/exerciseUtils';
import { colors, radius, spacing, typography } from '@/theme';

export default function SessionLogScreen() {
  useKeepAwake(); // screen stays on for the whole workout

  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  const {
    session,
    isInitializing,
    error,
    getCurrentExercise,
    getCurrentBlock,
    isCurrentExerciseInBlock,
    isLastExerciseOrBlock,
    updateSet,
    toggleSetCompletion,
    addSet,
    navigateToNextExercise,
    navigateToPreviousExercise,
    canFinishWorkout,
    clearSession,
    initializeSession,
  } = useInMemorySession(workoutId ?? '');

  const handleAbandonSession = () => {
    Alert.alert(
      'Abandon Session?',
      'Going back will abandon your current session and clear all progress.',
      [
        { text: 'Continue Training', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: () => {
            clearSession();
            router.back();
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (!session || session.currentExerciseIndex === 0) {
      handleAbandonSession();
    } else {
      navigateToPreviousExercise();
    }
  };

  if (!workoutId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={typography.headline}>Invalid session</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={typography.headline}>Couldn’t load session</Text>
          <Text style={typography.subhead}>{error}</Text>
          <Pressable onPress={() => initializeSession()}>
            <Text style={styles.link}>Try again</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isInitializing || !session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={typography.subhead}>Loading session…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = getCurrentExercise();
  const currentBlock = getCurrentBlock();
  const isInBlock = isCurrentExerciseInBlock();

  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={typography.headline}>Session complete</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const exercisesToDisplay = isInBlock && currentBlock ? currentBlock : [currentExercise];
  const isLast = isLastExerciseOrBlock();
  const blockLabel =
    isInBlock && currentExercise.blockId
      ? `Block ${currentExercise.blockId.replace('block-', '')}`
      : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={8} style={styles.backButton}>
          <SymbolView name="chevron.left" size={20} tintColor={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={typography.headline} numberOfLines={1}>
            {session.workoutTitle}
          </Text>
          <Text style={typography.footnote}>
            {blockLabel ??
              `Exercise ${session.currentExerciseIndex + 1} of ${session.exercises.length}`}
          </Text>
        </View>
        <Text style={styles.timer}>{formatDuration(session.duration)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {exercisesToDisplay.map((exercise) => {
          const exerciseIndex = session.exercises.findIndex((ex) => ex.id === exercise.id);
          const bodyweight =
            isBodyweightExercise({ equipment: exercise.equipment || null }) ||
            hasBodyweightSets(exercise.sets);

          return (
            <SessionExerciseCard
              key={exercise.id}
              exercise={exercise}
              isBodyweight={bodyweight}
              onToggleSetCompletion={(setIndex) => toggleSetCompletion(exerciseIndex, setIndex)}
              onUpdateSet={(setIndex, weight, reps) =>
                updateSet(exerciseIndex, setIndex, { actualLoad: weight, actualReps: reps })
              }
              onAddSet={() => addSet(exerciseIndex)}
            />
          );
        })}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        {isLast ? (
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              styles.finishCta,
              (!canFinishWorkout() || pressed) && styles.ctaDim,
            ]}
            disabled={!canFinishWorkout()}
            onPress={() => router.push(`/session/finish?workoutId=${workoutId}`)}>
            <Text style={styles.ctaLabel}>Finish Workout</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.cta, styles.nextCta, pressed && styles.ctaDim]}
            onPress={navigateToNextExercise}>
            <Text style={styles.ctaLabel}>Next Exercise</Text>
          </Pressable>
        )}
      </View>
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
    gap: spacing.md,
    padding: spacing.xl,
  },
  link: {
    ...typography.body,
    color: colors.foxStrongDeep,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fillMuted,
  },
  headerCenter: {
    flex: 1,
  },
  timer: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  cta: {
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextCta: {
    backgroundColor: colors.foxStrong,
  },
  finishCta: {
    backgroundColor: colors.foxFit,
  },
  ctaDim: {
    opacity: 0.5,
  },
  ctaLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
});
