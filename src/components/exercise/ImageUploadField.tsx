'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadFieldProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

// Supported formats
const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_FORMATS = ['video/mp4', 'video/quicktime', 'video/webm']; // MP4, MOV, WebM

// Size limits
const MAX_IMAGE_SIZE = 10485760; // 10MB for images
const MAX_VIDEO_SIZE = 52428800; // 50MB for videos (reasonable for short clips)

// Helper to check if URL is a video
const isVideoUrl = (url: string): boolean => {
  return url.includes('/video/upload/') || url.match(/\.(mp4|mov|webm)$/i) !== null;
};

export function ImageUploadField({ value, onChange, disabled = false }: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const isImage = ALLOWED_IMAGE_FORMATS.includes(file.type);
    const isVideo = ALLOWED_VIDEO_FORMATS.includes(file.type);

    if (!isImage && !isVideo) {
      return 'Please upload JPG, PNG, GIF, WebP, MP4, MOV, or WebM';
    }

    // Check size limits based on type
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    const maxSizeMB = isVideo ? 50 : 10;

    if (file.size > maxSize) {
      return `${isVideo ? 'Video' : 'Image'} size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
      throw new Error('Cloudinary cloud name not configured');
    }

    const isVideo = ALLOWED_VIDEO_FORMATS.includes(file.type);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'foxon_exercises');

    // Specify resource type for videos
    if (isVideo) {
      formData.append('resource_type', 'video');
    }

    // Use appropriate endpoint based on file type
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
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const mediaUrl = await uploadToCloudinary(file);
      onChange(mediaUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveMedia = () => {
    onChange(null);
    setError(null);
  };

  const isVideo = value ? isVideoUrl(value) : false;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        Exercise Image, GIF, or Video
      </label>

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50">
          {/* Media Preview */}
          <div className="relative aspect-video w-full">
            {isVideo ? (
              <video
                src={value}
                controls
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={value}
                alt="Exercise demonstration"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Remove Button */}
          {!disabled && (
            <button
              type="button"
              onClick={handleRemoveMedia}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              aria-label="Remove media"
            >
              <X size={18} />
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
            aria-label="Upload exercise media"
          />

          {/* Upload Button */}
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={disabled || isUploading}
            className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-cyan-400 hover:bg-cyan-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              {isUploading ? (
                <>
                  <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium text-gray-600">Uploading...</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload size={24} className="text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      Upload image, GIF, or video
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Images up to 10MB • Videos up to 50MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </button>
        </>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}

      {/* Help Text */}
      {!error && (
        <p className="text-xs text-gray-500 mt-2">
          Optional: Add a visual guide showing proper exercise form
        </p>
      )}
    </div>
  );
}