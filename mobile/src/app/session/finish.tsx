import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/api/client';
import type { EffortLevel } from '@/api/types';
import { Card } from '@/components/Card';
import { RPEPicker, rpeToEffortLevel } from '@/components/session/RPEPicker';
import { SessionPhotoButton } from '@/components/session/SessionPhotoButton';
import type { InMemorySession } from '@/hooks/useInMemorySession';
import { getDevotionVerdict } from '@/lib/devotionVerdicts';
import { formatDuration } from '@/lib/exerciseUtils';
import { getFoxQuote } from '@/lib/foxQuotes';
import { SessionStorage } from '@/lib/sessionStorage';
import { colors, radius, spacing, typography } from '@/theme';

interface DevotionData {
  devotionScore: number;
  devotionGrade: string;
}

type SaveStatus = 'saving' | 'completed' | 'error';

/**
 * Port of the web session finish flow (src/app/session/finish/page.tsx):
 * background-save the session on mount, collect the reflection (RPE + vibe),
 * seal it, then show the summary while polling for the async devotion score.
 */
export default function SessionFinishScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  const [session] = useState<InMemorySession | null>(() =>
    workoutId ? SessionStorage.getSession(workoutId) : null
  );

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saving');
  const savePromiseRef = useRef<Promise<string> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const [rpeValue, setRpeValue] = useState(7);
  const [vibeLine, setVibeLine] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showSummary, setShowSummary] = useState(false);
  const [devotion, setDevotion] = useState<DevotionData | null>(null);
  const [weekProgress, setWeekProgress] = useState<
    { completed: number; planned: number } | undefined
  >(undefined);

  // Kick off the background save once
  useEffect(() => {
    if (!session || savePromiseRef.current) return;

    const endTime = new Date();
    const sessionData = {
      workoutId: session.workoutId,
      workoutTitle: session.workoutTitle,
      startTime: session.startTime,
      endTime,
      duration: Math.floor(
        (endTime.getTime() - new Date(session.startTime).getTime()) / 1000
      ),
      exercises: session.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        order: exercise.order,
        notes: exercise.notes,
        sets: exercise.sets.map((set) => ({
          type: set.type,
          load: set.actualLoad,
          reps: set.actualReps,
          completed: set.completed,
          order: set.order,
          notes: set.notes,
        })),
      })),
    };

    savePromiseRef.current = api
      .post<{ success: boolean; sessionId: string }>('/api/sessions/complete', { sessionData })
      .then((result) => {
        sessionIdRef.current = result.sessionId;
        setSaveStatus('completed');
        return result.sessionId;
      });

    savePromiseRef.current.catch((err) => {
      console.error('Background save failed:', err);
      setSaveStatus('error');
    });
  }, [session]);

  // Poll for the async devotion score once the summary is showing
  useEffect(() => {
    if (!showSummary || devotion || !sessionIdRef.current) return;

    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 8;

    const poll = async () => {
      if (cancelled || !sessionIdRef.current) return;
      try {
        const data = await api.get<{
          devotionScore: number | null;
          devotionGrade: string | null;
        }>(`/api/sessions/${sessionIdRef.current}`);
        if (cancelled) return;
        if (data.devotionScore !== null) {
          setDevotion({
            devotionScore: data.devotionScore,
            devotionGrade: data.devotionGrade ?? '',
          });
          return;
        }
      } catch {
        // fall through to retry
      }
      retryCount++;
      if (retryCount < maxRetries && !cancelled) {
        const delay = Math.min(1000 * 2 ** (retryCount - 1), 5000);
        setTimeout(poll, delay);
      }
    };

    poll();

    // resume polling when app returns to foreground (timers freeze in background)
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !cancelled && !devotion) poll();
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [showSummary, devotion]);

  // Week progress for the fox quote context (non-critical)
  useEffect(() => {
    if (!showSummary || weekProgress) return;
    api
      .get<{ completed: number; planned: number }>('/api/week-progress')
      .then(setWeekProgress)
      .catch(() => {});
  }, [showSummary, weekProgress]);

  const handleSubmit = useCallback(async () => {
    if (!vibeLine.trim()) return;
    setIsSubmitting(true);
    try {
      const sessionId = sessionIdRef.current ?? (await savePromiseRef.current);
      if (!sessionId) throw new Error('Session save failed');

      const effort: EffortLevel = rpeToEffortLevel(rpeValue);
      await api.post(`/api/sessions/${sessionId}/seal`, {
        effort,
        vibeLine: vibeLine.trim(),
      });

      if (workoutId) SessionStorage.clearSession(workoutId);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowSummary(true);
    } catch (err) {
      Alert.alert(
        'Could not save',
        err instanceof Error ? err.message : 'Failed to save reflection'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [vibeLine, rpeValue, workoutId, queryClient]);

  const handleDone = useCallback(() => {
    router.dismissAll();
    router.replace('/');
  }, [router]);

  if (!workoutId || !session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={typography.headline}>No active session</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Summary phase ----
  if (showSummary) {
    const completedSets = session.exercises.reduce(
      (total, ex) => total + ex.sets.filter((set) => set.completed).length,
      0
    );
    const totalVolume = session.exercises.reduce(
      (total, ex) =>
        total +
        ex.sets
          .filter((set) => set.completed)
          .reduce((sum, set) => sum + set.actualLoad * set.actualReps, 0),
      0
    );

    const verdict = devotion ? getDevotionVerdict(devotion.devotionScore) : null;
    const quote = devotion ? getFoxQuote(devotion.devotionScore, weekProgress) : null;

    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.summaryContent}>
          <Text style={styles.summaryFox}>🦊</Text>
          <Text style={typography.title}>{session.workoutTitle}</Text>

          <View style={styles.scoreBlock}>
            {devotion ? (
              <>
                <Text style={styles.scoreValue}>{devotion.devotionScore}</Text>
                <Text style={styles.scoreCaption}>Devotion score</Text>
                {verdict ? <Text style={styles.verdict}>{verdict.verdict}</Text> : null}
              </>
            ) : (
              <>
                <ActivityIndicator />
                <Text style={styles.scoreCaption}>Calculating score…</Text>
              </>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
              <Text style={typography.caption}>Duration</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{completedSets}</Text>
              <Text style={typography.caption}>Sets</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{Math.round(totalVolume)}</Text>
              <Text style={typography.caption}>Volume (kg)</Text>
            </View>
          </View>

          {quote ? (
            <Card style={styles.quoteCard}>
              <Text style={styles.quoteLine}>“{quote.line}”</Text>
              {quote.weekLine ? <Text style={typography.footnote}>{quote.weekLine}</Text> : null}
            </Card>
          ) : null}

          {sessionIdRef.current ? <SessionPhotoButton sessionId={sessionIdRef.current} /> : null}
        </ScrollView>
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaDim]}
            onPress={handleDone}>
            <Text style={styles.ctaLabel}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Reflection phase ----
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={typography.title}>How was your session?</Text>
          {saveStatus === 'error' ? (
            <Card style={styles.errorCard}>
              <Text style={styles.errorText}>
                Saving your session failed. Check your connection — we’ll retry when you submit.
              </Text>
            </Card>
          ) : null}

          <Card style={styles.formCard}>
            <Text style={styles.fieldLabel}>Rate your effort</Text>
            <RPEPicker value={rpeValue} onChange={setRpeValue} disabled={isSubmitting} />

            <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>
              One-line vibe <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Crushed those bench sets!"
              placeholderTextColor={colors.textTertiary}
              value={vibeLine}
              onChangeText={setVibeLine}
              maxLength={200}
              editable={!isSubmitting}
            />
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              (!vibeLine.trim() || isSubmitting || pressed) && styles.ctaDim,
            ]}
            disabled={!vibeLine.trim() || isSubmitting}
            onPress={handleSubmit}>
            {isSubmitting ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.ctaLabel}>Done</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  link: {
    ...typography.body,
    color: colors.foxStrongDeep,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  formCard: {
    gap: spacing.sm,
  },
  errorCard: {
    backgroundColor: colors.destructiveSoft,
  },
  errorText: {
    ...typography.subhead,
    color: colors.destructive,
  },
  fieldLabel: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 17,
    color: colors.text,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  cta: {
    backgroundColor: colors.foxFit,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDim: {
    opacity: 0.5,
  },
  ctaLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  summaryContent: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  summaryFox: {
    fontSize: 64,
  },
  scoreBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.lg,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  scoreCaption: {
    ...typography.footnote,
  },
  verdict: {
    ...typography.subhead,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  quoteCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quoteLine: {
    ...typography.body,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
