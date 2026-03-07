'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { uploadToCloudinary } from '@/lib/utils/cloudinaryUpload';
import { SessionPhotoSheet } from './SessionPhotoSheet';

interface SessionPhotoFABProps {
  sessionId: string;
}

export function SessionPhotoFAB({ sessionId }: SessionPhotoFABProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPhotoUrl, setSavedPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCamera = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const cleanupPreview = useCallback(() => {
    setPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSelectedFile(null);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsSheetOpen(true);

    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedFile) return;

    setIsSaving(true);
    try {
      const imageUrl = await uploadToCloudinary(selectedFile, {
        folder: 'session_photos',
        preset: 'foxon_exercises',
      });

      await fetch(`/api/sessions/${sessionId}/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      setSavedPhotoUrl(imageUrl);
      setIsSheetOpen(false);
      cleanupPreview();
      toast.success('Photo attached');
    } catch (error) {
      console.error('Failed to save photo:', error);
      toast.error('Failed to save photo');
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, sessionId, cleanupPreview]);

  const handleRetake = useCallback(() => {
    setIsSheetOpen(false);
    cleanupPreview();
    // Small delay to let sheet close before opening camera
    setTimeout(() => openCamera(), 300);
  }, [openCamera, cleanupPreview]);

  const handleDelete = useCallback(() => {
    setIsSheetOpen(false);
    cleanupPreview();
  }, [cleanupPreview]);

  return (
    <>
      {/* Hidden file input — launches native iOS camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Take session photo"
      />

      {/* FAB */}
      <button
        onClick={openCamera}
        className={`fixed bottom-28 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
          savedPhotoUrl
            ? 'bg-white border-2 border-lime-400'
            : 'bg-[#0F172A] text-white'
        }`}
        aria-label={savedPhotoUrl ? 'Photo attached — tap to retake' : 'Take session photo'}
      >
        {savedPhotoUrl ? (
          <CheckCircle size={24} className="text-lime-500" />
        ) : (
          <Camera size={24} />
        )}
      </button>

      {/* Bottom Sheet */}
      <SessionPhotoSheet
        isOpen={isSheetOpen}
        onClose={() => {
          if (!isSaving) {
            setIsSheetOpen(false);
            cleanupPreview();
          }
        }}
        previewUrl={previewUrl}
        onSave={handleSave}
        onRetake={handleRetake}
        onDelete={handleDelete}
        isSaving={isSaving}
      />
    </>
  );
}
