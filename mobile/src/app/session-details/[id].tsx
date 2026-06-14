import { Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSessionDetails } from '@/api/sessions';
import { Card } from '@/components/Card';
import { SessionDetailsSkeleton } from '@/components/ui/Skeleton';
import { formatDateWithWeekday } from '@/lib/dateUtils';
import { formatDuration } from '@/lib/exerciseUtils';
import { colors, radius, spacing, typography } from '@/theme';

export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, isLoading } = useSessionDetails(id);

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: 'Session Review', headerBackTitle: 'Back' }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isLoading || !session ? (
          <SessionDetailsSkeleton />
        ) : (
          <>
            {/* Hero */}
            <Card style={styles.hero}>
              <Text style={typography.footnote}>
                {formatDateWithWeekday(new Date(session.date))}
              </Text>
              <Text style={typography.title}>{session.workout?.title ?? 'Session'}</Text>
              <View style={styles.heroStats}>
                {session.devotionScore != null && (
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{session.devotionScore}</Text>
                    <Text style={typography.caption}>Devotion</Text>
                  </View>
                )}
                {session.duration != null && (
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{formatDuration(session.duration)}</Text>
                    <Text style={typography.caption}>Duration</Text>
                  </View>
                )}
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{session.sessionExercises.length}</Text>
                  <Text style={typography.caption}>Exercises</Text>
                </View>
              </View>
              {session.devotionGrade ? (
                <Text style={styles.grade}>{session.devotionGrade}</Text>
              ) : null}
            </Card>

            {/* Photo */}
            {session.sessionPhoto?.imageUrl ? (
              <Image
                source={{ uri: session.sessionPhoto.imageUrl }}
                style={styles.photo}
                alt="Session photo"
              />
            ) : null}

            {/* Reflection */}
            {session.sessionSeal?.vibeLine ? (
              <Card>
                <Text style={styles.sectionTitle}>Reflection</Text>
                <Text style={styles.vibe}>“{session.sessionSeal.vibeLine}”</Text>
                {session.sessionSeal.note ? (
                  <Text style={typography.footnote}>{session.sessionSeal.note}</Text>
                ) : null}
              </Card>
            ) : null}

            {/* Exercises */}
            {session.sessionExercises.map((sessionExercise) => {
              const completed = sessionExercise.sessionSets.filter((set) => set.completed);
              return (
                <Card key={sessionExercise.id}>
                  <Text style={typography.headline}>{sessionExercise.exercise.name}</Text>
                  <Text style={typography.footnote}>
                    {completed.length} of {sessionExercise.sessionSets.length} sets completed
                  </Text>
                  <View style={styles.sets}>
                    {sessionExercise.sessionSets.map((set, index) => (
                      <View key={set.id} style={styles.setRow}>
                        <Text style={styles.setNumber}>
                          {set.type === 'WARMUP' ? 'W' : index + 1}
                        </Text>
                        <Text style={styles.setDetail}>
                          {set.load > 0 ? `${set.load} kg × ${set.reps}` : `${set.reps} reps`}
                        </Text>
                        {set.completed ? (
                          <SymbolView
                            name="checkmark.circle.fill"
                            size={18}
                            tintColor={colors.success}
                          />
                        ) : (
                          <SymbolView name="circle" size={18} tintColor={colors.fill} />
                        )}
                      </View>
                    ))}
                  </View>
                  {sessionExercise.notes ? (
                    <Text style={styles.notes}>{sessionExercise.notes}</Text>
                  ) : null}
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 48,
    gap: spacing.md,
  },
  hero: {
    gap: spacing.xs,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  heroStat: {
    alignItems: 'center',
    gap: 2,
  },
  heroStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  grade: {
    ...typography.subhead,
    marginTop: spacing.sm,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
  },
  sectionTitle: {
    ...typography.headline,
    marginBottom: spacing.sm,
  },
  vibe: {
    ...typography.body,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  sets: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  setNumber: {
    width: 22,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  setDetail: {
    ...typography.body,
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  notes: {
    ...typography.footnote,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
