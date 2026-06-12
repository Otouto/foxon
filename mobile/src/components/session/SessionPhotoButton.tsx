import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text } from 'react-native';

import { api } from '@/api/client';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import { colors, radius, spacing, typography } from '@/theme';

interface SessionPhotoButtonProps {
  sessionId: string;
}

/** Attach a photo to the finished session: native action sheet → camera/library → Cloudinary → API. */
export function SessionPhotoButton({ sessionId }: SessionPhotoButtonProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePicked = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(
        {
          uri: asset.uri,
          name: asset.fileName ?? `session_${sessionId}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        },
        { folder: 'foxon_sessions' }
      );
      await api.post(`/api/sessions/${sessionId}/photo`, { imageUrl });
      setPhotoUri(asset.uri);
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Could not save photo');
    } finally {
      setIsUploading(false);
    }
  };

  const pick = async (source: 'camera' | 'library') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    };

    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      await handlePicked(result.assets[0]);
    }
  };

  const showOptions = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Take Photo', 'Choose from Library'],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) pick('camera');
        if (buttonIndex === 2) pick('library');
      }
    );
  };

  if (photoUri) {
    return <Image source={{ uri: photoUri }} style={styles.preview} />;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      disabled={isUploading}
      onPress={showOptions}>
      {isUploading ? (
        <ActivityIndicator />
      ) : (
        <>
          <SymbolView name="camera" size={18} tintColor={colors.textSecondary} />
          <Text style={styles.label}>Add a session photo</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    backgroundColor: colors.card,
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    ...typography.subhead,
    fontWeight: '500',
  },
  preview: {
    alignSelf: 'stretch',
    height: 200,
    borderRadius: radius.lg,
  },
});
