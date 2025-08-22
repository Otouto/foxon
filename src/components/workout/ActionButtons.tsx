'use client';

import { Plus } from 'lucide-react';

interface ActionButtonsProps {
  onCompleteSet: () => void;
  onAddSet: () => void;
  isLastExercise?: boolean;
}

export function ActionButtons({ onCompleteSet, onAddSet, isLastExercise = false }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Add Set Button - Inline above footer */}
      <button 
        onClick={onAddSet}
        className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
        aria-label="Add a new set to the current exercise"
      >
        <Plus size={18} className="text-gray-600" />
        <span className="text-gray-700 font-medium">Add Set</span>
      </button>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Next Exercise Button - Only show if not last exercise */}
      {!isLastExercise && (
        <button 
          onClick={onCompleteSet}
          className="px-6 py-3 bg-cyan-400 text-white font-semibold rounded-xl hover:bg-cyan-500 transition-colors cursor-pointer"
          aria-label="Complete current exercise and move to next"
        >
          Next Exercise
        </button>
      )}
    </div>
  );
}
