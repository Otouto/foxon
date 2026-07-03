import { SymbolView } from 'expo-symbols';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { GroupSummary } from '@/lib/dateUtils';
import { colors } from '@/theme';

interface GroupHeaderProps {
  title: string;
  groupType: 'week' | 'month';
  summary: GroupSummary;
  collapsed: boolean;
  /** Groups without sessions have nothing to fold. */
  collapsible: boolean;
  onToggle: () => void;
}

function summaryColor(groupType: 'week' | 'month', summary: GroupSummary): string {
  if (groupType !== 'week') return colors.textTertiary;
  switch (summary.status) {
    case 'On track':
      return colors.success;
    case 'Keep going':
      return colors.warning;
    case 'Catch up':
      return colors.destructive;
    default:
      return colors.textTertiary;
  }
}

/**
 * Collapsible week/month header on the Review timeline: intelligent summary
 * line with week-status color, chevron chip that rotates when folded.
 */
export function GroupHeader({
  title,
  groupType,
  summary,
  collapsed,
  collapsible,
  onToggle,
}: GroupHeaderProps) {
  const rotation = useRef(new Animated.Value(collapsed ? 1 : 0)).current;

  useEffect(() => {
    const animation = Animated.timing(rotation, {
      toValue: collapsed ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [collapsed, rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-90deg'] });

  const subtitle =
    summary.intelligentHeader ??
    `${summary.totalSessions} session${summary.totalSessions !== 1 ? 's' : ''}`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.header,
        groupType === 'month' && styles.headerMonth,
        pressed && collapsible && styles.pressed,
      ]}
      onPress={onToggle}
      disabled={!collapsible}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      accessibilityState={{ expanded: !collapsed }}>
      <View style={styles.text}>
        <Text style={groupType === 'week' ? styles.titleWeek : styles.titleMonth}>{title}</Text>
        <Text style={[styles.subtitle, { color: summaryColor(groupType, summary) }]}>
          {subtitle}
        </Text>
      </View>
      {collapsible ? (
        <Animated.View style={[styles.chevronChip, { transform: [{ rotate }] }]}>
          <SymbolView name="chevron.down" size={12} tintColor={colors.textSecondary} />
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerMonth: {
    marginTop: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
  },
  titleWeek: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  titleMonth: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  chevronChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    shadowColor: '#141828',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
