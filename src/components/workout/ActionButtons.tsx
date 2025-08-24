'use client';

import { Plus } from 'lucide-react';

interface ActionButtonsProps {
  onAddSet: () => void;
}

export function ActionButtons({ onAddSet }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Add Set Button */}
      <button 
        onClick={onAddSet}
        className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
        aria-label="Add a new set to the current exercise"
      >
        <Plus size={18} className="text-gray-600" />
        <span className="text-gray-700 font-medium">Add Set</span>
      </button>
    </div>
  );
}
