import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { SetEditorSheet } from '@/components/session/SetEditorSheet';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { InMemoryExercise, InMemorySet } from '@/hooks/useInMemorySession';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { colors, radius, spacing } from '@/theme';

interface SessionExerciseCardProps {
  exercise: InMemoryExercise;
  isBodyweight: boolean;
  onToggleSetCompletion: (setIndex: number) => void;
  onUpdateSet: (setIndex: number, weight: number, reps: number) => void;
  onAddSet: () => void;
}

export function SessionExerciseCard({
  exercise,
  isBodyweight,
  onToggleSetCompletion,
  onUpdateSet,
  onAddSet,
}: SessionExerciseCardProps) {
  const { triggerHaptic } = useHapticFeedback();
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);

  const previous = exercise.previousSessionData;

  const handleToggle = (setIndex: number) => {
    const willComplete = !exercise.sets[setIndex].completed;
    triggerHaptic(willComplete ? 'medium' : 'light');
    onToggleSetCompletion(setIndex);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{exercise.exerciseName}</Text>

      <View style={styles.sets}>
        {exercise.sets.map((set, index) => (
          <SetRow
            key={set.id}
            set={set}
            index={index}
            isLast={index === exercise.sets.length - 1}
            isBodyweight={isBodyweight}
            previousLabel={
              previous?.[index]
                ? isBodyweight
                  ? `${previous[index].reps}`
                  : `${previous[index].load}×${previous[index].reps}`
                : null
            }
            onToggle={() => handleToggle(index)}
            onEdit={() => setEditingSetIndex(index)}
          />
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.addSet, pressed && styles.pressed]}
        onPress={() => {
          triggerHaptic('light');
          onAddSet();
        }}>
        <SymbolView name="plus" size={13} tintColor={colors.textSecondary} weight="bold" />
        <Text style={styles.addSetLabel}>Add set</Text>
      </Pressable>

      {editingSetIndex !== null && (
        <SetEditorSheet
          visible
          setNumber={editingSetIndex + 1}
          exerciseName={exercise.exerciseName}
          equipment={exercise.equipment ?? null}
          initialWeight={exercise.sets[editingSetIndex]?.actualLoad ?? 0}
          initialReps={exercise.sets[editingSetIndex]?.actualReps ?? 0}
          isBodyweightExercise={isBodyweight}
          onSave={(weight, reps) => {
            if (editingSetIndex !== null) onUpdateSet(editingSetIndex, weight, reps);
          }}
          onClose={() => setEditingSetIndex(null)}
        />
      )}
    </View>
  );
}

function SetRow({
  set,
  index,
  isLast,
  isBodyweight,
  previousLabel,
  onToggle,
  onEdit,
}: {
  set: InMemorySet;
  index: number;
  isLast: boolean;
  isBodyweight: boolean;
  previousLabel: string | null;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const prevCompleted = useRef(set.completed);

  // "Pop" the check when a set transitions into the completed state.
  useEffect(() => {
    if (set.completed && !prevCompleted.current && !reduceMotion) {
      scale.setValue(0.6);
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }).start();
    }
    prevCompleted.current = set.completed;
  }, [set.completed, reduceMotion, scale]);

  const setLabel = set.type === 'WARMUP' ? 'W' : index + 1;

  return (
    <View style={styles.setRowWrap}>
      <View style={styles.spineColumn}>
        <Pressable onPress={onToggle} hitSlop={6}>
          <Animated.View
            style={[
              styles.check,
              set.completed ? styles.checkDone : styles.checkPending,
              { transform: [{ scale }] },
            ]}>
            <SymbolView
              name="checkmark"
              size={18}
              weight="bold"
              tintColor={set.completed ? colors.onLime : '#B7BCC6'}
            />
          </Animated.View>
        </Pressable>
        {!isLast ? (
          <View style={[styles.spine, set.completed && styles.spineDone]} />
        ) : null}
      </View>

      <Pressable
        style={[styles.row, set.completed && styles.rowDone]}
        onPress={onEdit}>
        <Text style={styles.setNumber}>{setLabel}</Text>
        {!isBodyweight && (
          <View style={[styles.pill, set.completed && styles.pillDone]}>
            <Text style={styles.pillValue}>{set.actualLoad}</Text>
            <Text style={styles.pillUnit}> kg</Text>
          </View>
        )}
        <View style={[styles.pill, set.completed && styles.pillDone]}>
          <Text style={styles.pillValue}>{set.actualReps}</Text>
          <Text style={styles.pillUnit}> reps</Text>
        </View>
        {previousLabel ? (
          <Text style={styles.was} numberOfLines={1}>
            was {previousLabel}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 20,
    paddingTop: 22,
    marginBottom: spacing.lg,
    shadowColor: '#141828',
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  sets: {
    marginTop: spacing.md,
  },
  setRowWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  spineColumn: {
    alignItems: 'center',
  },
  check: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkPending: {
    backgroundColor: '#E6E8EC',
  },
  checkDone: {
    backgroundColor: colors.foxFit,
    shadowColor: 'rgba(132,204,22,0.6)',
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
  },
  spine: {
    width: 3,
    flex: 1,
    minHeight: 16,
    borderRadius: 2,
    marginVertical: 2,
    backgroundColor: '#E6E8EC',
  },
  spineDone: {
    backgroundColor: colors.foxFitSoft,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: radius.lg,
    marginBottom: 10,
    backgroundColor: '#F7F8FA',
  },
  rowDone: {
    backgroundColor: '#F2FBE0', // lime-50/100 blend
  },
  setNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    width: 16,
    fontVariant: ['tabular-nums'],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  pillDone: {
    backgroundColor: '#ECFCCB', // lime-100
    borderColor: 'transparent',
  },
  pillValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  pillUnit: {
    fontSize: 12,
    color: '#9AA0AC',
  },
  was: {
    marginLeft: 'auto',
    paddingLeft: 4,
    flexShrink: 1,
    fontSize: 11,
    color: '#C5CAD3',
    fontVariant: ['tabular-nums'],
  },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    marginTop: 2,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#F4F5F7',
  },
  pressed: {
    opacity: 0.6,
  },
  addSetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
