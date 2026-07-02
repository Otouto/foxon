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
import type { DevotionDeviation, DevotionPillars } from '@/api/sessions';
import type { EffortLevel } from '@/api/types';
import { BreathingFox } from '@/components/session/BreathingFox';
import { RPEPicker, rpeToEffortLevel } from '@/components/session/RPEPicker';
import { ScoreBreakdownSheet } from '@/components/session/ScoreBreakdownSheet';
import { SessionPhotoButton } from '@/components/session/SessionPhotoButton';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { AnimatedCount } from '@/components/AnimatedCount';
import { GradientButton } from '@/components/ui/GradientButton';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { InMemorySession } from '@/hooks/useInMemorySession';
import { getDevotionVerdict } from '@/lib/devotionVerdicts';
import { formatDuration } from '@/lib/exerciseUtils';
import { getFoxQuote } from '@/lib/foxQuotes';
import { SessionOutbox, type CompletedSessionPayload } from '@/lib/outbox';
import { SessionStorage } from '@/lib/sessionStorage';
import { colors, fonts, spacing, typography } from '@/theme';

interface DevotionData {
  devotionScore: number;
  devotionGrade: string;
  pillars: DevotionPillars | null;
  deviations: DevotionDeviation[] | null;
}

type SaveStatus = 'saving' | 'completed' | 'error';

/**
 * Port of the web session finish flow (src/app/session/finish/page.tsx), reframed
 * as the "Foxon Soul" Capture → Reveal moment. Same background-save / seal / poll
 * state machine underneath.
 */
export default function SessionFinishScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reduceMotion = useReduceMotion();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  const [session] = useState<InMemorySession | null>(() =>
    workoutId ? SessionStorage.getSession(workoutId) : null
  );

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saving');
  const saveStatusRef = useRef<SaveStatus>('saving');
  const savePromiseRef = useRef<Promise<string> | null>(null);
  const sessionDataRef = useRef<CompletedSessionPayload | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [rpeValue, setRpeValue] = useState(7);
  const [vibeLine, setVibeLine] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showSummary, setShowSummary] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [devotion, setDevotion] = useState<DevotionData | null>(null);
  const [scoringStalled, setScoringStalled] = useState(false);
  const [weekProgress, setWeekProgress] = useState<
    { completed: number; planned: number } | undefined
  >(undefined);

  const updateSaveStatus = useCallback((status: SaveStatus) => {
    saveStatusRef.current = status;
    setSaveStatus(status);
  }, []);

  /**
   * Save the session via the durable outbox: the payload hits MMKV before the
   * first network attempt and is only removed on confirmed success, so the
   * workout survives connection loss and app kills. Safe to call repeatedly —
   * the backend dedupes on (workout, startTime).
   */
  const attemptSave = useCallback((): Promise<string> => {
    if (!session) return Promise.reject(new Error('No active session'));

    // Build the payload once so startTime/endTime stay stable across retries
    if (!sessionDataRef.current) {
      const endTime = new Date();
      sessionDataRef.current = {
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
    }

    const sessionData = sessionDataRef.current;
    const pendingId = SessionOutbox.idFor(sessionData.workoutId, sessionData.startTime);
    SessionOutbox.enqueue(pendingId, sessionData);
    updateSaveStatus('saving');

    const promise = SessionOutbox.send(pendingId, sessionData).then((result) => {
      sessionIdRef.current = result.sessionId;
      setSessionId(result.sessionId);
      updateSaveStatus('completed');
      // The backend scores synchronously when fast — skip the poll entirely
      if (result.devotionScore != null) {
        setDevotion({
          devotionScore: result.devotionScore,
          devotionGrade: result.devotionGrade ?? '',
          pillars: result.devotionPillars ?? null,
          deviations: result.devotionDeviations ?? null,
        });
      }
      return result.sessionId;
    });

    savePromiseRef.current = promise;
    promise.catch((err) => {
      console.error('Background save failed:', err);
      updateSaveStatus('error');
    });
    return promise;
  }, [session, updateSaveStatus]);

  // Kick off the background save once
  useEffect(() => {
    if (!session || savePromiseRef.current) return;
    attemptSave().catch(() => {});
  }, [session, attemptSave]);

  // Retry a failed save when the app returns to the foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && saveStatusRef.current === 'error') {
        attemptSave().catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [attemptSave]);

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
          devotionPillars?: DevotionPillars | null;
          devotionDeviations?: DevotionDeviation[] | null;
        }>(`/api/sessions/${sessionIdRef.current}`);
        if (cancelled) return;
        if (data.devotionScore !== null) {
          setDevotion({
            devotionScore: data.devotionScore,
            devotionGrade: data.devotionGrade ?? '',
            pillars: data.devotionPillars ?? null,
            deviations: data.devotionDeviations ?? null,
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
      } else if (!cancelled) {
        // Give the user an honest state instead of an endless spinner
        setScoringStalled(true);
      }
    };

    poll();

    // resume polling when app returns to foreground (timers freeze in background)
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !cancelled && !devotion) {
        retryCount = 0; // fresh retry burst on foreground
        setScoringStalled(false);
        poll();
      }
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
      // If the background save failed, actually retry it (the payload is
      // safe in the outbox) instead of re-awaiting the rejected promise.
      let sessionId = sessionIdRef.current;
      if (!sessionId) {
        try {
          sessionId = await savePromiseRef.current;
        } catch {
          sessionId = await attemptSave();
        }
      }
      if (!sessionId) throw new Error('Session save failed');

      const effort: EffortLevel = rpeToEffortLevel(rpeValue);
      await api.post(`/api/sessions/${sessionId}/seal`, {
        effort,
        vibeLine: vibeLine.trim(),
      });

      if (workoutId) SessionStorage.clearSession(workoutId);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['review'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Next start of this workout should preload the just-logged session
      if (workoutId) queryClient.invalidateQueries({ queryKey: ['workout-preload', workoutId] });
      setShowSummary(true);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Failed to save reflection');
    } finally {
      setIsSubmitting(false);
    }
  }, [vibeLine, rpeValue, workoutId, queryClient, attemptSave]);

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

  const exerciseCount = session.exercises.length;

  // ---- Reveal phase ----
  if (showSummary) {
    const verdict = devotion ? getDevotionVerdict(devotion.devotionScore) : null;
    const quote = devotion ? getFoxQuote(devotion.devotionScore, weekProgress) : null;

    // Map the four devotion pillars to the reference's chips; the single
    // lagging pillar (<100) gets the amber treatment.
    const pillars = devotion?.pillars;
    const pillarRows = [
      { label: 'Exercises', pct: pillars?.EC != null ? Math.round(pillars.EC * 100) : null },
      { label: 'Sets', pct: pillars?.SC != null ? Math.round(pillars.SC * 100) : null },
      { label: 'Reps', pct: pillars?.RF != null ? Math.round(pillars.RF * 100) : null },
      { label: 'Weight', pct: pillars?.LF != null ? Math.round(pillars.LF * 100) : null },
    ];
    let laggingLabel: string | null = null;
    let laggingPct = 101;
    for (const row of pillarRows) {
      if (row.pct != null && row.pct < 100 && row.pct < laggingPct) {
        laggingPct = row.pct;
        laggingLabel = row.label;
      }
    }
    const chips = pillarRows.map((row) => ({ ...row, amber: row.label === laggingLabel }));

    return (
      <View style={styles.root}>
        <AmbientGlow
          color="rgba(34,211,238,0.22)"
          width={520}
          height={440}
          style={{ top: -60, alignSelf: 'center' }}
        />
        <AmbientGlow
          color="rgba(192,132,252,0.20)"
          width={460}
          height={400}
          style={{ top: -30, alignSelf: 'center' }}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.revealContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.eyebrow}>Your latest chapter</Text>
            <Text style={styles.revealTitle}>Session complete</Text>

            {/* Fox + speech bubble */}
            <View style={styles.foxRow}>
              <BreathingFox />
              <View style={styles.bubble}>
                {quote ? (
                  <>
                    <Text style={styles.bubbleTitle}>{quote.line}</Text>
                    {quote.weekLine ? <Text style={styles.bubbleSub}>{quote.weekLine}</Text> : null}
                  </>
                ) : scoringStalled ? (
                  <Text style={styles.bubbleSub}>
                    The score is still cooking — check this session in Review a bit later.
                  </Text>
                ) : (
                  <Text style={styles.bubbleSub}>Crunching your devotion…</Text>
                )}
              </View>
            </View>

            {/* Score ring */}
            <View style={styles.ringWrap}>
              {devotion ? (
                <ScoreRing
                  size={178}
                  strokeWidth={13}
                  progress={devotion.devotionScore}
                  animate={!reduceMotion}>
                  <AnimatedCount
                    value={devotion.devotionScore}
                    animate={!reduceMotion}
                    style={styles.ringScore}
                  />
                  <Text style={styles.ringCaption}>DEVOTION</Text>
                </ScoreRing>
              ) : (
                <ScoreRing size={178} strokeWidth={13} progress={0} animate={false}>
                  {scoringStalled ? null : <ActivityIndicator />}
                  <Text style={styles.ringCaption}>
                    {scoringStalled ? 'CHECK LATER' : 'SCORING…'}
                  </Text>
                </ScoreRing>
              )}
            </View>
            {verdict ? <Text style={styles.verdict}>{verdict.verdict}</Text> : null}

            {/* Pillar breakdown chips — the lagging pillar reads amber */}
            <View style={styles.chips}>
              {chips.map((chip) => (
                <View
                  key={chip.label}
                  style={[styles.chip, chip.amber && styles.chipAmber]}>
                  <Text style={[styles.chipLabel, chip.amber && styles.chipLabelAmber]}>
                    {chip.label}
                  </Text>
                  <Text style={[styles.chipValue, chip.amber && styles.chipValueAmber]}>
                    {chip.pct ?? '—'}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton label="Save to chronicle" variant="lime" onPress={handleDone} />
            {devotion ? (
              <Pressable
                onPress={() => setShowBreakdown(true)}
                hitSlop={8}
                style={({ pressed }) => [styles.howScored, pressed && styles.pressed]}>
                <Text style={styles.howScoredText}>How it scored</Text>
              </Pressable>
            ) : null}
          </View>
        </SafeAreaView>

        {devotion ? (
          <ScoreBreakdownSheet
            visible={showBreakdown}
            score={devotion.devotionScore}
            pillars={devotion.pillars}
            deviations={devotion.deviations}
            onClose={() => setShowBreakdown(false)}
          />
        ) : null}
      </View>
    );
  }

  // ---- Capture phase ----
  return (
    <View style={styles.root}>
      <AmbientGlow
        color="rgba(163,230,53,0.22)"
        width={420}
        height={340}
        style={{ top: -90, left: -60 }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Warm header */}
            <View style={styles.captureHeader}>
              <Text style={styles.eyebrow}>That’s a wrap</Text>
              <Text style={styles.captureTitle}>How did it feel?</Text>
              <Text style={styles.captureSubtitle}>
                {session.workoutTitle} · {formatDuration(session.duration)} · {exerciseCount}{' '}
                exercises
              </Text>
            </View>

            {saveStatus === 'error' ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>
                  Saving your session failed. Check your connection — we’ll retry when you submit.
                </Text>
              </View>
            ) : null}

            {/* Effort dial */}
            <View style={styles.softCard}>
              <View style={styles.cardLabelRow}>
                <Text style={styles.cardLabel}>EFFORT</Text>
                <Text style={styles.cardHint}>tap to set</Text>
              </View>
              <RPEPicker value={rpeValue} onChange={setRpeValue} disabled={isSubmitting} />
            </View>

            {/* Vibe */}
            <View style={styles.softCard}>
              <View style={styles.cardLabelRow}>
                <Text style={styles.cardLabel}>
                  ONE-LINE VIBE <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <View style={styles.vibeInputWrap}>
                <TextInput
                  style={styles.vibeInput}
                  placeholder="потужна треня з ранку до роботи"
                  placeholderTextColor={colors.textTertiary}
                  value={vibeLine}
                  onChangeText={setVibeLine}
                  maxLength={200}
                  editable={!isSubmitting}
                  multiline
                />
              </View>
            </View>

            {/* Photo — a moment to remember this session */}
            <SessionPhotoButton sessionId={sessionId} />
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton
              label="Reveal my score"
              variant="cyan"
              icon="chevron.right"
              disabled={!vibeLine.trim() || isSubmitting}
              onPress={handleSubmit}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
  // shared
  eyebrow: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.foxFitDeep,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  pressed: {
    opacity: 0.6,
  },
  // capture
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  captureHeader: {
    marginTop: spacing.sm,
    gap: 2,
  },
  captureTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  },
  captureSubtitle: {
    ...typography.footnote,
    marginTop: 2,
  },
  softCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 20,
    paddingTop: 22,
    shadowColor: '#141828',
    shadowOpacity: 0.09,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#9AA0AC',
  },
  cardHint: {
    fontSize: 12,
    color: '#CDD2DA',
  },
  required: {
    color: colors.destructive,
  },
  vibeInputWrap: {
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDEFF2',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  vibeInput: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.text,
    minHeight: 24,
  },
  errorCard: {
    backgroundColor: colors.destructiveSoft,
    borderRadius: 18,
    padding: spacing.lg,
  },
  errorText: {
    ...typography.subhead,
    color: colors.destructive,
  },
  // reveal
  revealContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  revealTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  foxRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  bubble: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    padding: 14,
    paddingHorizontal: 16,
    shadowColor: '#141828',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  bubbleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  bubbleSub: {
    fontSize: 13.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ringWrap: {
    marginTop: spacing.xl,
  },
  ringScore: {
    fontSize: 58,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  ringCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9AA0AC',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  verdict: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
  chip: {
    flexGrow: 1,
    flexBasis: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  chipAmber: {
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amberSoft,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  chipLabelAmber: {
    color: colors.amberText,
  },
  chipValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  chipValueAmber: {
    color: colors.amberSubtext,
  },
  howScored: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  howScoredText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
