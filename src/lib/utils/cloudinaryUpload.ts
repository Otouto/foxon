const ALLOWED_VIDEO_FORMATS = ['video/mp4', 'video/quicktime', 'video/webm'];

export async function uploadToCloudinary(
  file: File,
  options?: { folder?: string; preset?: string }
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured');
  }

  const preset = options?.preset || 'foxon_exercises';
  const isVideo = ALLOWED_VIDEO_FORMATS.includes(file.type);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);

  if (options?.folder) {
    formData.append('folder', options.folder);
  }

  if (isVideo) {
    formData.append('resource_type', 'video');
  }

  const endpoint = isVideo
    ? `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
    : `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

  const response = await fetch(endpoint, {
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
