import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { getDaysAgoLabel } from '@/lib/dateUtils';
import { colors, spacing, typography } from '@/theme';

interface LastSessionSnapshotProps {
  session: {
    id: string;
    workoutTitle: string;
    date: string;
    devotionScore: number | null;
    vibeLine: string | null;
  };
}

export function LastSessionSnapshot({ session }: LastSessionSnapshotProps) {
  const router = useRouter();
  const hasVibe = !!session.vibeLine;

  return (
    <Pressable onPress={() => router.push(`/session-details/${session.id}`)}>
      {({ pressed }) => (
        <Card style={pressed ? styles.pressed : undefined}>
          <View style={styles.topRow}>
            <Text style={styles.kicker}>LAST TIME</Text>
            <Text style={typography.caption}>{getDaysAgoLabel(new Date(session.date))}</Text>
          </View>

          {hasVibe ? (
            <Text style={styles.vibe} numberOfLines={3}>
              “{session.vibeLine}”
            </Text>
          ) : null}

          <View style={styles.mainRow}>
            <Text
              style={[styles.title, hasVibe ? styles.titleMuted : null]}
              numberOfLines={1}>
              {session.workoutTitle}
            </Text>
            {session.devotionScore !== null && (
              <Text style={styles.score}>{session.devotionScore}</Text>
            )}
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  kicker: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 1,
  },
  vibe: {
    fontSize: 18,
    lineHeight: 25,
    fontStyle: 'italic',
    fontFamily: 'Georgia',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.headline,
    flex: 1,
  },
  titleMuted: {
    ...typography.subhead,
    fontWeight: '500',
  },
  score: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
});
