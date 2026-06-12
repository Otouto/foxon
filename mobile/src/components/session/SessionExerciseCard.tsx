import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { SetEditorSheet } from '@/components/session/SetEditorSheet';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { InMemoryExercise } from '@/hooks/useInMemorySession';
import { colors, radius, spacing, typography } from '@/theme';

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
    <Card style={styles.card}>
      <Text style={typography.headline}>{exercise.exerciseName}</Text>
      {previous && previous.length > 0 ? (
        <Text style={styles.previous}>
          Last time:{' '}
          {previous
            .map((set) => (isBodyweight ? `${set.reps}` : `${set.load}×${set.reps}`))
            .join('  ·  ')}
        </Text>
      ) : null}

      <View style={styles.sets}>
        {exercise.sets.map((set, index) => (
          <View key={set.id} style={[styles.setRow, set.completed && styles.setRowCompleted]}>
            <Pressable
              onPress={() => handleToggle(index)}
              style={[styles.check, set.completed && styles.checkCompleted]}
              hitSlop={6}>
              <SymbolView
                name="checkmark"
                size={16}
                tintColor={set.completed ? '#1A2E05' : colors.textSecondary}
              />
            </Pressable>

            <Pressable style={styles.setInfo} onPress={() => setEditingSetIndex(index)}>
              <Text style={styles.setNumber}>
                {set.type === 'WARMUP' ? 'W' : index + 1}
              </Text>
              {!isBodyweight && (
                <View style={[styles.pill, set.completed && styles.pillCompleted]}>
                  <Text style={styles.pillValue}>{set.actualLoad}</Text>
                  <Text style={styles.pillUnit}> kg</Text>
                </View>
              )}
              <View style={[styles.pill, set.completed && styles.pillCompleted]}>
                <Text style={styles.pillValue}>{set.actualReps}</Text>
                <Text style={styles.pillUnit}> reps</Text>
              </View>
            </Pressable>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.addSet, pressed && styles.pressed]}
        onPress={() => {
          triggerHaptic('light');
          onAddSet();
        }}>
        <SymbolView name="plus" size={14} tintColor={colors.textSecondary} />
        <Text style={styles.addSetLabel}>Add set</Text>
      </Pressable>

      {editingSetIndex !== null && (
        <SetEditorSheet
          visible
          setNumber={editingSetIndex + 1}
          initialWeight={exercise.sets[editingSetIndex]?.actualLoad ?? 0}
          initialReps={exercise.sets[editingSetIndex]?.actualReps ?? 0}
          isBodyweightExercise={isBodyweight}
          onSave={(weight, reps) => {
            if (editingSetIndex !== null) onUpdateSet(editingSetIndex, weight, reps);
          }}
          onClose={() => setEditingSetIndex(null)}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  previous: {
    ...typography.footnote,
    marginTop: spacing.xs,
  },
  sets: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.cardMuted,
  },
  setRowCompleted: {
    backgroundColor: '#F7FEE7', // lime-50
  },
  check: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fill,
  },
  checkCompleted: {
    backgroundColor: colors.foxFit,
  },
  setInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  setNumber: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    minWidth: 20,
    fontVariant: ['tabular-nums'],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pillCompleted: {
    backgroundColor: '#ECFCCB', // lime-100
    borderColor: 'transparent',
  },
  pillValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  pillUnit: {
    ...typography.footnote,
  },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  addSetLabel: {
    ...typography.subhead,
    fontWeight: '500',
  },
});
