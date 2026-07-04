import { LinearGradient } from 'expo-linear-gradient';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { SessionExerciseCard } from '@/components/session/SessionExerciseCard';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { GradientButton } from '@/components/ui/GradientButton';
import { useInMemorySession } from '@/hooks/useInMemorySession';
import { formatDuration, hasBodyweightSets, isBodyweightExercise } from '@/lib/exerciseUtils';
import { colors, gradients, spacing, typography } from '@/theme';

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

  // Overall progress = completed sets / total sets across the entire workout.
  const totalSets = session.exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const doneSets = session.exercises.reduce(
    (n, ex) => n + ex.sets.filter((set) => set.completed).length,
    0
  );
  const progress = totalSets > 0 ? doneSets / totalSets : 0;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <View style={styles.root}>
        <AmbientGlow
          color="rgba(190,242,100,0.42)"
          width={460}
          height={360}
          style={{ top: -120, left: -35 }}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Hero header */}
          <View style={styles.header}>
            <Pressable onPress={handleBack} hitSlop={8} style={styles.backButton}>
              <SymbolView name="chevron.left" size={18} weight="semibold" tintColor={colors.text} />
            </Pressable>
            <View style={styles.headerCenter}>
              <View style={styles.titleLine}>
                <Text style={styles.title} numberOfLines={1}>
                  {blockLabel ?? session.workoutTitle}
                </Text>
                {blockLabel ? <Text style={styles.fox}>🦊</Text> : null}
              </View>
              <Text style={styles.subtitle} numberOfLines={1}>
                {blockLabel
                  ? session.workoutTitle
                  : `Exercise ${session.currentExerciseIndex + 1} of ${session.exercises.length}`}
              </Text>
            </View>
            <Text style={styles.timer}>{formatDuration(session.duration)}</Text>
          </View>

          {/* Progress */}
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={gradients.limeSoft}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]}
            />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
              <GradientButton
                label="Finish Workout"
                variant="lime"
                icon="flag.checkered"
                disabled={!canFinishWorkout()}
                onPress={() => router.push(`/session/finish?workoutId=${workoutId}`)}
              />
            ) : (
              <GradientButton
                label="Next exercise"
                variant="cyan"
                icon="chevron.right"
                onPress={navigateToNextExercise}
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  headerCenter: {
    flex: 1,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  fox: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  timer: {
    fontSize: 23,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
});
