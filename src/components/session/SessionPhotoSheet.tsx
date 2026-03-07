'use client';

import { BottomSheet, BottomSheetTitle } from '@/components/ui/BottomSheet';
import { RotateCcw, Trash2, Check } from 'lucide-react';

interface SessionPhotoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  previewUrl: string | null;
  onSave: () => void;
  onRetake: () => void;
  onDelete: () => void;
  isSaving: boolean;
}

export function SessionPhotoSheet({
  isOpen,
  onClose,
  previewUrl,
  onSave,
  onRetake,
  onDelete,
  isSaving,
}: SessionPhotoSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxHeight="max-h-[90vh]"
      dismissible={!isSaving}
    >
      <BottomSheetTitle className="sr-only">Session Photo</BottomSheetTitle>

      <div className="flex flex-col flex-1 overflow-hidden px-4 pb-6">
        {/* Photo Preview */}
        {previewUrl && (
          <div className="flex-1 overflow-hidden rounded-2xl mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Session photo preview"
              className="w-full h-full object-contain max-h-[60vh] rounded-2xl"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onDelete}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl border border-gray-200 text-gray-600 font-medium disabled:opacity-50 transition-colors"
          >
            <Trash2 size={18} />
            Delete
          </button>
          <button
            onClick={onRetake}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl border border-gray-200 text-gray-600 font-medium disabled:opacity-50 transition-colors"
          >
            <RotateCcw size={18} />
            Retake
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-lime-400 text-black font-semibold disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Check size={18} />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
