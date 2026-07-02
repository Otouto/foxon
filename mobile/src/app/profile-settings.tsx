import { Picker } from '@react-native-picker/picker';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { useProfile, useUpdateProfile } from '@/api/profile';
import { Card } from '@/components/Card';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { colors, radius, spacing, typography } from '@/theme';

export default function ProfileSettingsScreen() {
  const { data } = useProfile();
  const updateProfile = useUpdateProfile();
  const { triggerHaptic } = useHapticFeedback();

  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (data) {
      setWeeklyGoal(data.user.weeklyGoal);
      setEmail(data.user.email ?? '');
    }
  }, [data]);

  const handleSave = () => {
    updateProfile.mutate(
      { weeklyGoal, email: email.trim() || null },
      {
        onSuccess: () => {
          triggerHaptic('medium');
          Alert.alert('Saved', 'Your settings have been updated.');
        },
        onError: (err) =>
          Alert.alert('Error', err instanceof Error ? err.message : 'Could not save settings'),
      }
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Settings', headerBackTitle: 'Profile' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card>
          <Text style={typography.headline}>Weekly goal</Text>
          <Text style={typography.footnote}>Workouts per week</Text>
          <Picker color={colors.text} selectedValue={weeklyGoal} onValueChange={(value) => setWeeklyGoal(value)}>
            {[1, 2, 3, 4, 5, 6, 7].map((goal) => (
              <Picker.Item key={goal} label={`${goal} workout${goal !== 1 ? 's' : ''}`} value={goal} />
            ))}
          </Picker>
        </Card>

        <Card>
          <Text style={typography.headline}>Chronicle email</Text>
          <Text style={typography.footnote}>Where your monthly chapter is sent</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </Card>

        <Pressable
          style={({ pressed }) => [styles.save, (pressed || updateProfile.isPending) && styles.dim]}
          disabled={updateProfile.isPending}
          onPress={handleSave}>
          {updateProfile.isPending ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.saveLabel}>Save</Text>
          )}
        </Pressable>
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
    gap: spacing.lg,
  },
  input: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 17,
    color: colors.text,
    marginTop: spacing.md,
  },
  save: {
    backgroundColor: colors.tint,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dim: {
    opacity: 0.6,
  },
  saveLabel: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '600',
  },
});
