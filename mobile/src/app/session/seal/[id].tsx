import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/api/client';
import { useSessionDetails } from '@/api/sessions';
import type { EffortLevel } from '@/api/types';
import { RPEPicker, rpeToEffortLevel } from '@/components/session/RPEPicker';
import { SessionPhotoButton } from '@/components/session/SessionPhotoButton';
import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { GradientButton } from '@/components/ui/GradientButton';
import { SessionDetailsSkeleton } from '@/components/ui/Skeleton';
import { formatDuration } from '@/lib/exerciseUtils';
import { colors, fonts, spacing, typography } from '@/theme';

/**
 * Seal-it-later capture for sessions that finished without a reflection —
 * primarily watch-logged sessions (no keyboard or camera on the wrist).
 * Same effort + vibe + photo trio as session/finish; the reveal afterwards is
 * the session-details chapter screen, where the score already lives.
 */
export default function SealSessionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, isLoading } = useSessionDetails(id);

  const [rpeValue, setRpeValue] = useState(7);
  const [vibeLine, setVibeLine] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already sealed (e.g. stale list entry) — the chapter screen is the truth
  useEffect(() => {
    if (session?.sessionSeal) {
      router.replace(`/session-details/${id}`);
    }
  }, [session?.sessionSeal, id, router]);

  const handleSubmit = useCallback(async () => {
    if (!id || !vibeLine.trim()) return;
    setIsSubmitting(true);
    try {
      const effort: EffortLevel = rpeToEffortLevel(rpeValue);
      await api.post(`/api/sessions/${id}/seal`, {
        effort,
        vibeLine: vibeLine.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ['review'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['session', id] });
      router.replace(`/session-details/${id}`);
    } catch (err) {
      Alert.alert(
        'Could not save',
        err instanceof Error ? err.message : 'Failed to save reflection'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [id, vibeLine, rpeValue, queryClient, router]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: true, title: 'Seal Session', headerBackTitle: 'Back' }} />
      <AmbientGlow
        color="rgba(163,230,53,0.22)"
        width={420}
        height={340}
        style={{ top: -90, left: -60 }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {isLoading || !session ? (
          <SessionDetailsSkeleton />
        ) : (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View style={styles.captureHeader}>
                <Text style={styles.eyebrow}>Still warm from the wrist</Text>
                <Text style={styles.captureTitle}>How did it feel?</Text>
                <Text style={styles.captureSubtitle}>
                  {session.workout?.title ?? 'Session'}
                  {session.duration != null ? ` · ${formatDuration(session.duration)}` : ''} ·{' '}
                  {session.sessionExercises.length} exercises
                </Text>
              </View>

              <View style={styles.softCard}>
                <View style={styles.cardLabelRow}>
                  <Text style={styles.cardLabel}>EFFORT</Text>
                  <Text style={styles.cardHint}>tap to set</Text>
                </View>
                <RPEPicker value={rpeValue} onChange={setRpeValue} disabled={isSubmitting} />
              </View>

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

              <SessionPhotoButton sessionId={id ?? null} />
            </ScrollView>

            <View style={styles.footer}>
              <GradientButton
                label="Seal this chapter"
                variant="cyan"
                icon="chevron.right"
                disabled={!vibeLine.trim() || isSubmitting}
                onPress={handleSubmit}
              />
            </View>
          </KeyboardAvoidingView>
        )}
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
  eyebrow: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.foxFitDeep,
  },
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
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
});
