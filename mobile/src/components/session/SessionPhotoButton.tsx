import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import { colors, spacing, typography } from '@/theme';

interface SessionPhotoButtonProps {
  /** Null until the background session save resolves; the tile is disabled meanwhile. */
  sessionId: string | null;
}

/**
 * "Add a moment" tile for the finish capture step: native action sheet →
 * camera/library → Cloudinary → API. Disabled until the session has been saved.
 */
export function SessionPhotoButton({ sessionId }: SessionPhotoButtonProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePicked = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!sessionId) return;
    setIsUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(
        { uri: asset.uri, type: asset.mimeType ?? 'image/jpeg' },
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

  const disabled = !sessionId || isUploading;

  return (
    <Pressable
      style={({ pressed }) => [styles.tile, disabled && styles.tileDisabled, pressed && styles.pressed]}
      disabled={disabled}
      onPress={showOptions}>
      <View style={styles.thumb}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.thumbImage} alt="Session photo" />
        ) : isUploading ? (
          <ActivityIndicator />
        ) : (
          <SymbolView name="camera" size={24} tintColor={colors.textSecondary} />
        )}
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{photoUri ? 'Moment saved' : 'Add a moment'}</Text>
        <Text style={styles.subtitle}>
          {photoUri ? 'Tap to replace your photo' : 'A photo to remember this session'}
        </Text>
      </View>
      <View style={styles.plus}>
        <SymbolView name="plus" size={16} weight="bold" tintColor={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 14,
    shadowColor: '#141828',
    shadowOpacity: 0.09,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  tileDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fillMuted,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    ...typography.footnote,
    marginTop: 1,
  },
  plus: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F3F5',
  },
});
