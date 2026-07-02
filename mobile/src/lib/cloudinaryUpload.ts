// Ported from src/lib/utils/cloudinaryUpload.ts — unsigned upload straight to
// Cloudinary. Uses a native URLSession upload task (expo-file-system) instead of
// fetch+FormData: SDK 56's global fetch is expo/fetch, whose FormData serializer
// rejects RN's { uri, name, type } file parts ("Unsupported FormDataPart
// implementation"). The native task also streams from disk and continues in a
// background session if the app is suspended mid-upload.

import { File, UploadType } from 'expo-file-system';

interface RNFile {
  uri: string;
  type: string;
}

export async function uploadToCloudinary(
  file: RNFile,
  options?: { folder?: string; preset?: string }
): Promise<string> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured');
  }

  const preset = options?.preset || 'foxon_exercises';

  const result = await new File(file.uri).upload(
    `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
    {
      uploadType: UploadType.MULTIPART,
      fieldName: 'file',
      mimeType: file.type,
      parameters: {
        upload_preset: preset,
        ...(options?.folder ? { folder: options.folder } : {}),
      },
    }
  );

  let data: { secure_url?: string; error?: { message?: string } } = {};
  try {
    data = JSON.parse(result.body);
  } catch {
    // non-JSON body (e.g. gateway error page) — fall through to status check
  }

  if (result.status < 200 || result.status >= 300 || !data.secure_url) {
    throw new Error(data.error?.message || 'Upload failed');
  }

  return data.secure_url;
}
