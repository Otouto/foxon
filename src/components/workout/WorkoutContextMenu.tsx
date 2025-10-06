'use client';

import { X, Edit, Archive } from 'lucide-react';
import { BottomSheet, BottomSheetTitle, BottomSheetDescription } from '@/components/ui/BottomSheet';

interface WorkoutContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId: string;
  workoutName: string;
  onEdit: () => void;
  onArchive: () => void;
}

export function WorkoutContextMenu({
  isOpen,
  onClose,
  workoutId: _workoutId,
  workoutName,
  onEdit,
  onArchive,
}: WorkoutContextMenuProps) {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex-1 min-w-0 pr-4">
          <BottomSheetTitle className="text-lg font-semibold text-gray-900 truncate">
            {workoutName}
          </BottomSheetTitle>
          <BottomSheetDescription className="text-sm text-gray-500 mt-1">
            Workout options
          </BottomSheetDescription>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {/* Edit Workout */}
        <button
          onClick={() => handleAction(onEdit)}
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
        >
          <Edit size={20} className="text-gray-700 flex-shrink-0" />
          <span className="text-gray-900 font-medium">Edit Workout</span>
        </button>

        {/* Divider */}
        <div className="my-2 border-t border-gray-100"></div>

        {/* Archive Workout */}
        <button
          onClick={() => handleAction(onArchive)}
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
        >
          <Archive size={20} className="text-gray-700 flex-shrink-0" />
          <span className="text-gray-900 font-medium">Archive Workout</span>
        </button>
      </div>

      {/* Bottom Padding for safe area */}
      <div className="pb-safe h-6"></div>
    </BottomSheet>
  );
}
