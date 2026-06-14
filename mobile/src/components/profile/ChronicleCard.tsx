import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { colors, radius, spacing, typography } from '@/theme';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface ChronicleCardProps {
  entry: {
    state: 'brand_new' | 'no_chapter' | 'has_chapter';
    latestChapter?: { id: string; title: string; month: number; year: number };
  };
}

export function ChronicleCard({ entry }: ChronicleCardProps) {
  const router = useRouter();
  const { triggerHaptic } = useHapticFeedback();

  // Brand-new: not yet earned — quiet, not tappable.
  if (entry.state === 'brand_new') {
    return (
      <Card style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.fillMuted }]}>
          <SymbolView name="book.closed" size={20} tintColor={colors.textTertiary} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.textTertiary }]}>Fox Chronicle</Text>
          <Text style={[styles.sub, { color: colors.textTertiary }]}>
            Train to unlock your story
          </Text>
        </View>
      </Card>
    );
  }

  const chapter = entry.latestChapter;
  const onPress = () => {
    triggerHaptic('light');
    router.push(chapter ? `/chronicle/${chapter.id}` : '/chronicle');
  };

  const title = chapter ? chapter.title : 'Fox Chronicle';
  const sub =
    chapter ? `${MONTH_NAMES[chapter.month]} ${chapter.year}` : 'Your first chapter is ready';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.amberCard, styles.row, pressed && styles.pressed]}>
      <View style={[styles.icon, { backgroundColor: colors.amberSoft }]}>
        <SymbolView name="book.closed" size={20} tintColor={colors.amberIcon} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, styles.titleSerif, { color: colors.amberText }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.sub, { color: colors.amberSubtext }]}>{sub}</Text>
      </View>
      <SymbolView name="chevron.right" size={15} tintColor={colors.amberIcon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  amberCard: {
    backgroundColor: colors.amberBg,
    borderRadius: radius.lg,
    padding: spacing.xl - 4,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    ...typography.headline,
  },
  titleSerif: {
    fontFamily: 'Georgia',
    fontWeight: '400',
  },
  sub: {
    ...typography.subhead,
    marginTop: 2,
  },
});
