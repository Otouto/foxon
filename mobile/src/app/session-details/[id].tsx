import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSessionDetails } from '@/api/sessions';
import { AnimatedCount } from '@/components/AnimatedCount';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { SessionDetailsSkeleton } from '@/components/ui/Skeleton';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { formatDateWithWeekday } from '@/lib/dateUtils';
import { formatDuration } from '@/lib/exerciseUtils';
import { colors, fonts, spacing, typography } from '@/theme';

export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, isLoading } = useSessionDetails(id);
  const reduceMotion = useReduceMotion();
  const { user } = useUser();
  const firstName = user?.firstName ?? null;

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{ headerShown: true, title: 'Session Review', headerBackTitle: 'Back' }}
      />
      <AmbientGlow
        color="rgba(192,132,252,0.24)"
        width={520}
        height={420}
        style={{ top: -80, alignSelf: 'center' }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {isLoading || !session ? (
          <SessionDetailsSkeleton />
        ) : (
          <>
            {/* Chapter hero */}
            <LinearGradient
              colors={['#FFFFFF', '#FBF7FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.hero}>
              <Text style={styles.heroEyebrow}>A chapter in your journey</Text>
              <View style={styles.heroRing}>
                <ScoreRing
                  size={150}
                  strokeWidth={11}
                  progress={session.devotionScore ?? 0}
                  animate={!reduceMotion}>
                  {session.devotionScore != null ? (
                    <AnimatedCount
                      value={session.devotionScore}
                      animate={!reduceMotion}
                      style={styles.heroScore}
                    />
                  ) : (
                    <Text style={styles.heroScore}>—</Text>
                  )}
                </ScoreRing>
              </View>
              <Text style={styles.heroTitle}>
                {formatDateWithWeekday(new Date(session.date))}
              </Text>
              {session.workout?.title ? (
                <Text style={styles.heroWorkout}>{session.workout.title}</Text>
              ) : null}
              <View style={styles.heroPill}>
                {session.duration != null ? (
                  <Text style={styles.heroPillText}>{formatDuration(session.duration)}</Text>
                ) : null}
                {session.duration != null ? <View style={styles.heroPillSep} /> : null}
                <Text style={styles.heroPillText}>
                  {session.sessionExercises.length} exercise
                  {session.sessionExercises.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </LinearGradient>

            {/* Photo keepsake */}
            {session.sessionPhoto?.imageUrl ? (
              <>
                <Text style={styles.sectionLabel}>SESSION PHOTO</Text>
                <Image
                  source={{ uri: session.sessionPhoto.imageUrl }}
                  style={styles.photo}
                  alt="Session photo"
                />
              </>
            ) : null}

            {/* Reflection */}
            {session.sessionSeal?.vibeLine ? (
              <>
                <Text style={styles.sectionLabel}>REFLECTION</Text>
                <LinearGradient
                  colors={['#FBF7FF', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quoteCard}>
                  <Text style={styles.quote}>“{session.sessionSeal.vibeLine}”</Text>
                  {session.sessionSeal.note ? (
                    <Text style={styles.note}>{session.sessionSeal.note}</Text>
                  ) : null}
                </LinearGradient>
              </>
            ) : null}

            {/* Performance */}
            <Text style={styles.sectionLabel}>PERFORMANCE</Text>
            {session.sessionExercises.map((sessionExercise, index) => {
              const completed = sessionExercise.sessionSets.filter((set) => set.completed);
              return (
                <View key={sessionExercise.id} style={styles.perfCard}>
                  <View style={styles.perfHeader}>
                    <View style={styles.perfBadge}>
                      <Text style={styles.perfBadgeText}>{index + 1}</Text>
                    </View>
                    <View style={styles.perfTitleArea}>
                      <Text style={styles.perfName}>{sessionExercise.exercise.name}</Text>
                      <Text style={styles.perfMeta}>
                        {completed.length} of {sessionExercise.sessionSets.length} sets
                      </Text>
                    </View>
                  </View>
                  {completed.length > 0 ? (
                    <View style={styles.setList}>
                      {completed.map((set, setIndex) => (
                        <View key={set.id} style={styles.setRow}>
                          <Text style={styles.setLabel}>
                            {set.type === 'WARMUP' ? 'Warm-up' : `Set ${setIndex + 1}`}
                          </Text>
                          <Text style={styles.setValue}>
                            {set.load > 0
                              ? `${set.reps} reps × ${set.load} kg`
                              : `${set.reps} reps`}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noSets}>No completed sets</Text>
                  )}
                  {sessionExercise.notes ? (
                    <Text style={styles.perfNotes}>{sessionExercise.notes}</Text>
                  ) : null}
                </View>
              );
            })}

            {/* Closing line */}
            <Text style={styles.closing}>
              See you next chapter{firstName ? `, ${firstName}` : ''}.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F5FB',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 48,
  },
  // ── Hero ──
  hero: {
    borderRadius: 30,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE4FB',
    shadowColor: 'rgba(168,85,247,0.5)',
    shadowOpacity: 1,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 18 },
  },
  heroEyebrow: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: '#9B6FD4',
  },
  heroRing: {
    marginTop: 18,
  },
  heroScore: {
    fontSize: 46,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 18,
    textAlign: 'center',
  },
  heroWorkout: {
    fontSize: 13,
    color: '#7A5BA8',
    marginTop: 2,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5EFFB',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 13,
    marginTop: 14,
  },
  heroPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#7A5BA8',
  },
  heroPillSep: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C4A8E0',
  },
  // ── Sections ──
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textTertiary,
    marginTop: 24,
    marginBottom: 12,
  },
  photo: {
    width: '100%',
    height: 280,
    borderRadius: 24,
  },
  quoteCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEE4FB',
    paddingVertical: 22,
    paddingHorizontal: 22,
    shadowColor: 'rgba(168,85,247,0.35)',
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  quote: {
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 29,
    color: '#3F3157',
  },
  note: {
    ...typography.footnote,
    marginTop: spacing.sm,
  },
  // ── Performance ──
  perfCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#141828',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  perfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  perfBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
  perfTitleArea: {
    flex: 1,
  },
  perfName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  perfMeta: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  setList: {
    gap: 8,
    marginTop: 14,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7FEE7',
    borderWidth: 1,
    borderColor: '#ECF6CF',
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  setLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3F6212',
  },
  setValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2E05',
    fontVariant: ['tabular-nums'],
  },
  noSets: {
    ...typography.footnote,
    marginTop: spacing.md,
  },
  perfNotes: {
    ...typography.footnote,
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  closing: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: '#9B6FD4',
    textAlign: 'center',
    marginTop: 24,
  },
});
