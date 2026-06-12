import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ExerciseListItem } from '@shared/types/exercise';

import { useWorkout } from '@/api/queries';
import { useExercises } from '@/api/exercises';
import { Card } from '@/components/Card';
import { SetEditorSheet } from '@/components/session/SetEditorSheet';
import { useWorkoutCreation, type WorkoutExerciseItem } from '@/hooks/useWorkoutCreation';
import { colors, radius, spacing, typography } from '@/theme';

export default function WorkoutCreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { data: editWorkout } = useWorkout(editId);

  const creation = useWorkoutCreation();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editingSet, setEditingSet] = useState<{ exerciseId: string; order: number } | null>(null);

  useEffect(() => {
    if (editWorkout && editId) {
      creation.loadWorkoutForEditing(editWorkout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editWorkout, editId]);

  const handleSave = async (asDraft: boolean) => {
    try {
      await creation.saveWorkout(asDraft, editId);
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      if (editId) queryClient.invalidateQueries({ queryKey: ['workout', editId] });
      router.back();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Failed to save workout');
    }
  };

  const editingExercise = editingSet
    ? creation.exercises.find((ex) => ex.id === editingSet.exerciseId)
    : null;
  const editingSetData = editingExercise?.sets.find((set) => set.order === editingSet?.order);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: editId ? 'Edit Workout' : 'New Workout',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.nameInput}
            placeholder="Workout name"
            placeholderTextColor={colors.textTertiary}
            value={creation.workoutName}
            onChangeText={creation.updateWorkoutName}
          />

          {creation.exercises.map((item) => (
            <CreationExerciseCard
              key={item.id}
              item={item}
              onRemove={() =>
                Alert.alert('Remove exercise?', item.exercise.name, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => creation.removeExercise(item.id),
                  },
                ])
              }
              onAddSet={() => creation.addSet(item.id)}
              onRemoveSet={(order) => creation.removeSet(item.id, order)}
              onEditSet={(order) => setEditingSet({ exerciseId: item.id, order })}
            />
          ))}

          <Pressable
            style={({ pressed }) => [styles.addExercise, pressed && styles.dim]}
            onPress={() => setPickerVisible(true)}>
            <SymbolView name="plus.circle.fill" size={20} tintColor={colors.text} />
            <Text style={styles.addExerciseLabel}>Add exercise</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.draftButton, pressed && styles.dim]}
            disabled={!creation.canSave || creation.isSaving}
            onPress={() => handleSave(true)}>
            <Text style={styles.draftLabel}>Save Draft</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              (!creation.canSave || creation.isSaving || pressed) && styles.dim,
            ]}
            disabled={!creation.canSave || creation.isSaving}
            onPress={() => handleSave(false)}>
            {creation.isSaving ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.saveLabel}>Save Workout</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(exercise) => {
          creation.addExercise(exercise);
          setPickerVisible(false);
        }}
      />

      {editingSet && editingSetData ? (
        <SetEditorSheet
          visible
          setNumber={editingSet.order}
          initialWeight={editingSetData.targetLoad}
          initialReps={editingSetData.targetReps}
          isBodyweightExercise={false}
          onSave={(weight, reps) =>
            creation.updateSet(editingSet.exerciseId, editingSet.order, {
              targetLoad: weight,
              targetReps: reps,
            })
          }
          onClose={() => setEditingSet(null)}
        />
      ) : null}
    </>
  );
}

function CreationExerciseCard({
  item,
  onRemove,
  onAddSet,
  onRemoveSet,
  onEditSet,
}: {
  item: WorkoutExerciseItem;
  onRemove: () => void;
  onAddSet: () => void;
  onRemoveSet: (order: number) => void;
  onEditSet: (order: number) => void;
}) {
  return (
    <Card>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={typography.headline}>{item.exercise.name}</Text>
          {item.exercise.muscleGroup ? (
            <Text style={typography.footnote}>{item.exercise.muscleGroup}</Text>
          ) : null}
        </View>
        <Pressable onPress={onRemove} hitSlop={8}>
          <SymbolView name="trash" size={18} tintColor={colors.destructive} />
        </Pressable>
      </View>

      <View style={styles.sets}>
        {item.sets.map((set) => (
          <View key={set.order} style={styles.setRow}>
            <Text style={styles.setNumber}>{set.order}</Text>
            <Pressable style={styles.setPill} onPress={() => onEditSet(set.order)}>
              <Text style={styles.setPillText}>
                {set.targetLoad} kg × {set.targetReps}
              </Text>
            </Pressable>
            {item.sets.length > 1 ? (
              <Pressable onPress={() => onRemoveSet(set.order)} hitSlop={8}>
                <SymbolView name="minus.circle" size={18} tintColor={colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <Pressable style={({ pressed }) => [styles.addSet, pressed && styles.dim]} onPress={onAddSet}>
        <SymbolView name="plus" size={14} tintColor={colors.textSecondary} />
        <Text style={styles.addSetLabel}>Add set</Text>
      </Pressable>
    </Card>
  );
}

function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseListItem) => void;
}) {
  const [query, setQuery] = useState('');
  const { data: exercises, isLoading } = useExercises(query.trim() || undefined);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
        <View style={styles.modalHeader}>
          <Text style={typography.headline}>Choose Exercise</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.modalClose}>Close</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises"
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: spacing.xl }} />
        ) : (
          <FlatList
            data={exercises ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: spacing.lg }}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item }) => (
              <Pressable onPress={() => onSelect(item)}>
                {({ pressed }) => (
                  <Card style={pressed ? styles.dim : undefined}>
                    <Text style={typography.headline}>{item.name}</Text>
                    <Text style={typography.footnote}>
                      {[item.muscleGroup, item.equipment].filter(Boolean).join(' · ') || '—'}
                    </Text>
                  </Card>
                )}
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  nameInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sets: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  setNumber: {
    width: 20,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  setPill: {
    flex: 1,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  setPillText: {
    fontSize: 15,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  addSetLabel: {
    ...typography.subhead,
    fontWeight: '500',
  },
  addExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.separator,
  },
  addExerciseLabel: {
    ...typography.body,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  draftButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    backgroundColor: colors.card,
  },
  draftLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.tint,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveLabel: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '600',
  },
  dim: {
    opacity: 0.6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  modalClose: {
    ...typography.body,
    color: colors.textSecondary,
  },
  searchInput: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 17,
    color: colors.text,
  },
});
