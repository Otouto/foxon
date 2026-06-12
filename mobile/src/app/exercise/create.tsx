import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { useCreateExercise, useEquipment, useMuscleGroups } from '@/api/exercises';
import { Card } from '@/components/Card';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import { colors, radius, spacing, typography } from '@/theme';

export default function ExerciseCreateScreen() {
  const router = useRouter();
  const { data: muscleGroups } = useMuscleGroups();
  const { data: equipment } = useEquipment();
  const createExercise = useCreateExercise();

  const [name, setName] = useState('');
  const [muscleGroupId, setMuscleGroupId] = useState<string | undefined>(undefined);
  const [equipmentId, setEquipmentId] = useState<string | undefined>(undefined);
  const [instructions, setInstructions] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      let imageUrl: string | undefined;
      if (imageUri) {
        imageUrl = await uploadToCloudinary(
          { uri: imageUri, name: `exercise_${Date.now()}.jpg`, type: 'image/jpeg' },
          { folder: 'foxon_exercises' }
        );
      }
      await createExercise.mutateAsync({
        name: name.trim(),
        muscleGroupId,
        equipmentId,
        instructions: instructions.trim() || undefined,
        imageUrl,
      });
      router.back();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Failed to create exercise');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: 'New Exercise', headerBackTitle: 'Back' }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Incline Bench Press"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
          />
        </Card>

        <Card>
          <Text style={styles.label}>Muscle group</Text>
          <Picker selectedValue={muscleGroupId} onValueChange={(value) => setMuscleGroupId(value)}>
            <Picker.Item label="None" value={undefined} />
            {(muscleGroups ?? []).map((group) => (
              <Picker.Item key={group.id} label={group.name} value={group.id} />
            ))}
          </Picker>
        </Card>

        <Card>
          <Text style={styles.label}>Equipment</Text>
          <Picker selectedValue={equipmentId} onValueChange={(value) => setEquipmentId(value)}>
            <Picker.Item label="None" value={undefined} />
            {(equipment ?? []).map((item) => (
              <Picker.Item key={item.id} label={item.name} value={item.id} />
            ))}
          </Picker>
        </Card>

        <Card>
          <Text style={styles.label}>Instructions</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Optional notes on form, tempo, cues…"
            placeholderTextColor={colors.textTertiary}
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />
        </Card>

        <Pressable style={({ pressed }) => [styles.imageButton, pressed && styles.dim]} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} alt="Exercise photo" />
          ) : (
            <>
              <SymbolView name="photo" size={20} tintColor={colors.textSecondary} />
              <Text style={styles.imageLabel}>Add photo</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.save, (!name.trim() || isSaving || pressed) && styles.dim]}
          disabled={!name.trim() || isSaving}
          onPress={handleSave}>
          {isSaving ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.saveLabel}>Create Exercise</Text>
          )}
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 48,
  },
  label: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 17,
    color: colors.text,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.separator,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
  },
  imageLabel: {
    ...typography.subhead,
    fontWeight: '500',
  },
  save: {
    backgroundColor: colors.tint,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dim: {
    opacity: 0.6,
  },
  saveLabel: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '600',
  },
});
