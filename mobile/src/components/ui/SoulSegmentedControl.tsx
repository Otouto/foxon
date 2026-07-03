import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { colors, radius } from '@/theme';

export interface SegmentOption {
  key: string;
  label: string;
  icon: SymbolViewProps['name'];
}

interface SoulSegmentedControlProps {
  options: readonly SegmentOption[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

const PADDING = 3;

/**
 * Foxon take on a segmented control: soft gray well, a sliding white pill,
 * SF Symbol per segment. Replaces the native SegmentedControl for a warmer,
 * on-brand look.
 */
export function SoulSegmentedControl({
  options,
  selectedIndex,
  onChange,
}: SoulSegmentedControlProps) {
  const { triggerHaptic } = useHapticFeedback();
  const [innerWidth, setInnerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const segmentWidth = innerWidth > 0 ? innerWidth / options.length : 0;

  useEffect(() => {
    if (segmentWidth === 0) return;
    Animated.spring(translateX, {
      toValue: selectedIndex * segmentWidth,
      useNativeDriver: true,
      stiffness: 260,
      damping: 24,
      mass: 1,
    }).start();
  }, [selectedIndex, segmentWidth, translateX]);

  return (
    <View
      style={styles.container}
      accessibilityRole="tablist"
      onLayout={(event) => setInnerWidth(event.nativeEvent.layout.width - PADDING * 2)}>
      {segmentWidth > 0 ? (
        <Animated.View style={[styles.pill, { width: segmentWidth, transform: [{ translateX }] }]} />
      ) : null}
      {options.map((option, index) => {
        const selected = index === selectedIndex;
        return (
          <Pressable
            key={option.key}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => {
              if (index === selectedIndex) return;
              triggerHaptic('light');
              onChange(index);
            }}>
            <SymbolView
              name={option.icon}
              size={16}
              tintColor={selected ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.fillMuted,
    borderRadius: radius.lg,
    padding: PADDING,
  },
  pill: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: radius.lg - PADDING,
    backgroundColor: colors.card,
    shadowColor: '#141828',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.text,
  },
});
