import { Picker } from '@react-native-picker/picker';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { GradientButton } from '@/components/ui/GradientButton';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { colors, spacing, typography } from '@/theme';

interface SetEditorSheetProps {
  visible: boolean;
  setNumber: number;
  exerciseName?: string;
  equipment?: string | null;
  initialWeight: number;
  initialReps: number;
  isBodyweightExercise: boolean;
  onSave: (weight: number, reps: number) => void;
  onClose: () => void;
}

/**
 * Compact bottom sheet (not a full-height page sheet) holding the real
 * UIPickerView wheels (@react-native-picker/picker). Dimmed backdrop + slide-up
 * card sized to its content. Weight: 0–200 kg in 0.5 steps; reps: 1–100.
 */
export function SetEditorSheet({
  visible,
  setNumber,
  exerciseName,
  equipment,
  initialWeight,
  initialReps,
  isBodyweightExercise,
  onSave,
  onClose,
}: SetEditorSheetProps) {
  const { triggerHaptic } = useHapticFeedback();
  const reduceMotion = useReduceMotion();
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);

  const slide = useRef(new Animated.Value(1)).current; // 1 = hidden (down), 0 = shown

  useEffect(() => {
    if (visible) {
      setWeight(initialWeight);
      setReps(initialReps);
      if (reduceMotion) {
        slide.setValue(0);
      } else {
        slide.setValue(1);
        Animated.timing(slide, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    }
  }, [visible, initialWeight, initialReps, reduceMotion, slide]);

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

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 500] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Edit Set {setNumber}</Text>
              {exerciseName ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {exerciseName}
                  {equipment ? ` · ${equipment}` : ''}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <SymbolView name="xmark" size={14} weight="bold" tintColor={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.pickers}>
            {!isBodyweightExercise && (
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Weight (kg)</Text>
                <Picker
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  color={colors.text}
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
                itemStyle={styles.pickerItem}
                color={colors.text}
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

          <GradientButton label="Done" variant="lime" onPress={handleSave} style={styles.doneButton} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17,24,39,0.32)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D7DAE0',
    alignSelf: 'center',
    marginBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#9AA0AC',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F3F5',
  },
  pickers: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
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
    height: 180,
  },
  pickerItem: {
    fontSize: 22,
  },
  doneButton: {
    marginTop: spacing.lg,
  },
});
