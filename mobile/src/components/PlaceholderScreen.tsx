import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={typography.title}>{title}</Text>
      <Text style={styles.hint}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  hint: {
    ...typography.subhead,
  },
});
