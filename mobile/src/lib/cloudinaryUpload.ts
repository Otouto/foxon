// Ported from src/lib/utils/cloudinaryUpload.ts — unsigned upload straight to
// Cloudinary; only difference is the RN file shape ({ uri, name, type }) instead of File.

interface RNFile {
  uri: string;
  name: string;
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

  const formData = new FormData();
  // RN's FormData accepts { uri, name, type } for file parts
  formData.append('file', file as unknown as Blob);
  formData.append('upload_preset', preset);

  if (options?.folder) {
    formData.append('folder', options.folder);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
}
