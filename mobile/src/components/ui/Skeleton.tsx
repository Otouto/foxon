import { useEffect, useRef } from 'react';
import { Animated, View, type DimensionValue, type ViewStyle } from 'react-native';

import { Card } from '@/components/Card';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { colors, radius, spacing } from '@/theme';

/**
 * Skeleton placeholders shown only on a true first-ever load (no cached data).
 * With the persisted query cache, data is usually restored from disk on cold
 * start, so these rarely appear after the first install.
 *
 * Shimmer uses core Animated (project policy: no reanimated) and falls back to a
 * static muted block when Reduce Motion is enabled.
 */
export function SkeletonBlock({
  width = '100%',
  height = 14,
  borderRadius = radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: colors.fill, opacity }, style]}
    />
  );
}

function SkeletonCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <Card style={style}>{children}</Card>;
}

const row = (count: number) => Array.from({ length: count }, (_, i) => i);

export function DashboardSkeleton() {
  return (
    <View style={{ gap: spacing.lg }}>
      <SkeletonCard style={{ gap: spacing.md }}>
        <SkeletonBlock width={120} height={14} />
        <SkeletonBlock width="70%" height={28} />
        <SkeletonBlock width="100%" height={10} borderRadius={radius.full} />
      </SkeletonCard>
      <SkeletonCard style={{ gap: spacing.md }}>
        <SkeletonBlock width={140} height={16} />
        <SkeletonBlock width="100%" height={10} borderRadius={radius.full} />
        <SkeletonBlock width="60%" height={12} />
      </SkeletonCard>
      <SkeletonCard style={{ gap: spacing.sm }}>
        <SkeletonBlock width={100} height={14} />
        <SkeletonBlock width="80%" height={18} />
      </SkeletonCard>
    </View>
  );
}

export function WorkoutsSkeleton() {
  return (
    <View style={{ gap: spacing.md }}>
      {row(4).map((i) => (
        <SkeletonCard key={i} style={{ gap: spacing.sm }}>
          <SkeletonBlock width="55%" height={18} />
          <SkeletonBlock width="80%" height={12} />
          <SkeletonBlock width="40%" height={12} />
        </SkeletonCard>
      ))}
    </View>
  );
}

export function ReviewListSkeleton() {
  return (
    <View style={{ padding: spacing.lg, gap: spacing.lg }}>
      <SkeletonBlock width={120} height={14} />
      {row(3).map((i) => (
        <SkeletonCard key={i} style={{ gap: spacing.sm }}>
          <SkeletonBlock width="60%" height={18} />
          <SkeletonBlock width="45%" height={12} />
          <SkeletonBlock width="90%" height={12} />
        </SkeletonCard>
      ))}
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={{ padding: spacing.lg, gap: spacing.lg }}>
      <View style={{ alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
        <SkeletonBlock width={84} height={84} borderRadius={radius.full} />
        <SkeletonBlock width={160} height={20} />
        <SkeletonBlock width={120} height={12} />
      </View>
      {row(3).map((i) => (
        <SkeletonCard key={i} style={{ gap: spacing.md }}>
          <SkeletonBlock width="40%" height={16} />
          <SkeletonBlock width="100%" height={48} />
        </SkeletonCard>
      ))}
    </View>
  );
}

export function SessionDetailsSkeleton() {
  return (
    <View style={{ gap: spacing.md }}>
      <SkeletonCard style={{ gap: spacing.sm }}>
        <SkeletonBlock width={140} height={12} />
        <SkeletonBlock width="65%" height={24} />
        <View style={{ flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm }}>
          {row(3).map((i) => (
            <View key={i} style={{ gap: 4, alignItems: 'center' }}>
              <SkeletonBlock width={40} height={22} />
              <SkeletonBlock width={48} height={10} />
            </View>
          ))}
        </View>
      </SkeletonCard>
      {row(2).map((i) => (
        <SkeletonCard key={i} style={{ gap: spacing.sm }}>
          <SkeletonBlock width="50%" height={18} />
          <SkeletonBlock width="35%" height={12} />
          <SkeletonBlock width="100%" height={12} />
          <SkeletonBlock width="100%" height={12} />
        </SkeletonCard>
      ))}
    </View>
  );
}

export function ExerciseHistorySkeleton() {
  return (
    <View style={{ gap: spacing.md }}>
      {row(4).map((i) => (
        <SkeletonCard key={i} style={{ gap: spacing.sm }}>
          <SkeletonBlock width="45%" height={18} />
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            {row(3).map((j) => (
              <SkeletonBlock key={j} width={60} height={28} borderRadius={radius.full} />
            ))}
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function WorkoutDetailSkeleton() {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
        <SkeletonBlock width="80%" height={14} />
        <SkeletonBlock width="40%" height={12} />
      </View>
      {row(3).map((i) => (
        <SkeletonCard key={i} style={{ gap: spacing.sm }}>
          <SkeletonBlock width="50%" height={18} />
          <SkeletonBlock width="30%" height={12} />
          <SkeletonBlock width="100%" height={12} />
        </SkeletonCard>
      ))}
    </View>
  );
}

export function ChronicleSkeleton() {
  return (
    <View style={{ gap: spacing.md }}>
      <SkeletonBlock width="70%" height={24} />
      {row(8).map((i) => (
        <SkeletonBlock key={i} width={i % 3 === 2 ? '60%' : '100%'} height={14} />
      ))}
    </View>
  );
}
