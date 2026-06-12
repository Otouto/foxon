import { Picker } from '@react-native-picker/picker';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { colors, radius, spacing, typography } from '@/theme';

interface SetEditorSheetProps {
  visible: boolean;
  setNumber: number;
  initialWeight: number;
  initialReps: number;
  isBodyweightExercise: boolean;
  onSave: (weight: number, reps: number) => void;
  onClose: () => void;
}

/**
 * Native iOS sheet (UISheetPresentationController via RN Modal pageSheet)
 * with real UIPickerView wheels — replaces the web's vaul drawer +
 * @ncdai/react-wheel-picker combination.
 * Weight: 0–200 kg in 0.5 steps; reps: 1–100 (same ranges as web usePickerOptions).
 */
export function SetEditorSheet({
  visible,
  setNumber,
  initialWeight,
  initialReps,
  isBodyweightExercise,
  onSave,
  onClose,
}: SetEditorSheetProps) {
  const { triggerHaptic } = useHapticFeedback();
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);

  useEffect(() => {
    if (visible) {
      setWeight(initialWeight);
      setReps(initialReps);
    }
  }, [visible, initialWeight, initialReps]);

  const weightOptions = useMemo(() => {
    const options: number[] = [];
    for (let value = 0; value <= 200; value += 0.5) options.push(value);
    return options;
  }, []);

  const repOptions = useMemo(() => Array.from({ length: 100 }, (_, i) => i + 1), []);

  const handleSave = () => {
    triggerHaptic('medium');
    onSave(weight, reps);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={typography.headline}>Set {setNumber}</Text>
          <Pressable onPress={handleSave} hitSlop={8}>
            <Text style={styles.save}>Save</Text>
          </Pressable>
        </View>

        <View style={styles.pickers}>
          {!isBodyweightExercise && (
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Weight (kg)</Text>
              <Picker
                style={styles.picker}
                selectedValue={weight}
                onValueChange={(value) => {
                  triggerHaptic('light');
                  setWeight(value);
                }}>
                {weightOptions.map((option) => (
                  <Picker.Item
                    key={option}
                    label={option % 1 === 0 ? String(option) : option.toFixed(1)}
                    value={option}
                  />
                ))}
              </Picker>
            </View>
          )}
          <View style={styles.pickerColumn}>
            <Text style={styles.pickerLabel}>Reps</Text>
            <Picker
              style={styles.picker}
              selectedValue={reps}
              onValueChange={(value) => {
                triggerHaptic('light');
                setReps(value);
              }}>
              {repOptions.map((option) => (
                <Picker.Item key={option} label={String(option)} value={option} />
              ))}
            </Picker>
          </View>
        </View>

        <Pressable style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]} onPress={handleSave}>
          <Text style={styles.saveButtonLabel}>Save Set</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  cancel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  save: {
    ...typography.body,
    fontWeight: '600',
  },
  pickers: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    flex: 1,
  },
  pickerColumn: {
    flex: 1,
    maxWidth: 180,
  },
  pickerLabel: {
    ...typography.footnote,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  picker: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.foxFit,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  pressed: {
    opacity: 0.8,
  },
  saveButtonLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
});
