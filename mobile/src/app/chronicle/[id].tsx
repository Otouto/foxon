import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { useChronicle } from '@/api/profile';
import { colors, spacing, typography } from '@/theme';

export default function ChronicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: chronicle, isLoading } = useChronicle(id);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: chronicle?.title ?? 'Chapter',
          headerBackTitle: 'Chronicle',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isLoading || !chronicle ? (
          <View style={styles.centered}>
            <ActivityIndicator />
          </View>
        ) : (
          <Markdown style={markdownStyles}>{chronicle.contentMd}</Markdown>
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
  },
  centered: {
    paddingVertical: 64,
    alignItems: 'center',
  },
});

const markdownStyles = {
  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
  heading1: { ...typography.title, marginTop: spacing.lg, marginBottom: spacing.sm },
  heading2: { ...typography.headline, marginTop: spacing.lg, marginBottom: spacing.sm },
  heading3: { ...typography.headline, marginTop: spacing.md, marginBottom: spacing.xs },
  paragraph: { marginTop: 0, marginBottom: spacing.md },
  blockquote: {
    backgroundColor: colors.card,
    borderLeftColor: colors.foxFit,
    borderLeftWidth: 3,
    paddingHorizontal: spacing.md,
  },
};
