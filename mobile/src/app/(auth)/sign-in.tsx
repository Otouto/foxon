import { useSignIn } from '@clerk/clerk-expo';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme';

type Step = 'credentials' | 'emailCode';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [busy, setBusy] = useState(false);

  if (!isLoaded) return null;

  const finishIfComplete = async (status: string | null, createdSessionId: string | null) => {
    if (status === 'complete' && createdSessionId) {
      await setActive({ session: createdSessionId });
      return true;
    }
    return false;
  };

  const signInWithPassword = async () => {
    setBusy(true);
    try {
      const attempt = await signIn.create({ identifier: email.trim(), password });
      if (!(await finishIfComplete(attempt.status, attempt.createdSessionId))) {
        Alert.alert('Sign in', `Additional step required: ${attempt.status}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not sign in';
      Alert.alert('Sign in failed', message);
    } finally {
      setBusy(false);
    }
  };

  const sendEmailCode = async () => {
    if (!email.trim()) {
      Alert.alert('Email needed', 'Enter your email address first, then request a code.');
      return;
    }
    setBusy(true);
    try {
      const attempt = await signIn.create({ identifier: email.trim() });
      const emailFactor = attempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      );
      if (!emailFactor || !('emailAddressId' in emailFactor)) {
        Alert.alert('Sign in', 'Email code sign-in is not available for this account.');
        return;
      }
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });
      setStep('emailCode');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send code';
      Alert.alert('Sign in failed', message);
    } finally {
      setBusy(false);
    }
  };

  const verifyEmailCode = async () => {
    setBusy(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: code.trim(),
      });
      if (!(await finishIfComplete(attempt.status, attempt.createdSessionId))) {
        Alert.alert('Sign in', 'Verification incomplete. Please try again.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid code';
      Alert.alert('Verification failed', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.hero}>
          <Text style={styles.logo}>🦊</Text>
          <Text style={styles.title}>Foxon</Text>
          <Text style={styles.subtitle}>Your strength journey</Text>
        </View>

        {step === 'credentials' ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              style={[styles.button, (!email || !password || busy) && styles.buttonDisabled]}
              disabled={!email || !password || busy}
              onPress={signInWithPassword}>
              {busy ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.buttonLabel}>Sign in</Text>
              )}
            </Pressable>
            <Pressable style={styles.linkButton} disabled={busy} onPress={sendEmailCode}>
              <Text style={[styles.linkLabel, !email && styles.linkDisabled]}>
                Email me a sign-in code instead
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.codeHint}>
              We sent a code to {email.trim()}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Verification code"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              value={code}
              onChangeText={setCode}
            />
            <Pressable
              style={[styles.button, (!code || busy) && styles.buttonDisabled]}
              disabled={!code || busy}
              onPress={verifyEmailCode}>
              {busy ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.buttonLabel}>Verify</Text>
              )}
            </Pressable>
            <Pressable style={styles.linkButton} onPress={() => setStep('credentials')}>
              <Text style={styles.linkLabel}>Back</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.largeTitle,
  },
  subtitle: {
    ...typography.subhead,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 17,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.tint,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  linkLabel: {
    ...typography.subhead,
    color: colors.text,
  },
  linkDisabled: {
    color: colors.textTertiary,
  },
  codeHint: {
    ...typography.subhead,
    textAlign: 'center',
  },
});
