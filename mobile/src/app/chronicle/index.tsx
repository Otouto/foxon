import { Stack, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useChronicles } from '@/api/profile';
import { Card } from '@/components/Card';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { colors, spacing, typography } from '@/theme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ChronicleListScreen() {
  const router = useRouter();
  const { data: chronicles, isLoading, refetch } = useChronicles();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: 'Fox Chronicle', headerBackTitle: 'Back' }}
      />
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={chronicles ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator />
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={typography.subhead}>No chapters yet</Text>
              <Text style={typography.footnote}>
                A new chapter is written automatically each month you train.
              </Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/chronicle/${item.id}`)}>
            {({ pressed }) => (
              <Card style={pressed ? styles.pressed : undefined}>
                <Text style={styles.chapterNumber}>Chapter {item.chapterNumber}</Text>
                <Text style={typography.headline}>{item.title}</Text>
                <Text style={typography.footnote}>
                  {MONTHS[item.month - 1]} {item.year}
                  {item.emailSentAt ? ' · emailed' : ''}
                </Text>
              </Card>
            )}
          </Pressable>
        )}
      />
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
    paddingBottom: spacing.xxl,
  },
  centered: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  chapterNumber: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
});
