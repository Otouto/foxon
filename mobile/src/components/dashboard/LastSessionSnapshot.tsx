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

  return (
    <Pressable onPress={() => router.push('/review')}>
      {({ pressed }) => (
        <Card style={pressed ? styles.pressed : undefined}>
          <View style={styles.topRow}>
            <Text style={styles.kicker}>LAST SESSION</Text>
            <Text style={typography.caption}>{getDaysAgoLabel(new Date(session.date))}</Text>
          </View>
          <View style={styles.mainRow}>
            <View style={styles.titleColumn}>
              <Text style={typography.headline} numberOfLines={1}>
                {session.workoutTitle}
              </Text>
              {session.vibeLine ? (
                <Text style={styles.vibe} numberOfLines={1}>
                  “{session.vibeLine}”
                </Text>
              ) : null}
            </View>
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
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleColumn: {
    flex: 1,
  },
  vibe: {
    ...typography.subhead,
    fontStyle: 'italic',
    marginTop: 2,
  },
  score: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
});
