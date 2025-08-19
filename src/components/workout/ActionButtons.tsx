'use client';

import { Plus } from 'lucide-react';

interface ActionButtonsProps {
  onCompleteSet: () => void;
  onAddSet: () => void;
}

export function ActionButtons({ onCompleteSet, onAddSet }: ActionButtonsProps) {
  return (
    <div className="flex gap-3 mb-8">
      <button 
        onClick={onCompleteSet}
        className="flex-1 bg-cyan-400 text-white font-semibold py-3 rounded-xl cursor-pointer"
      >
        Complete Set
      </button>
      <button 
        onClick={onAddSet}
        className="px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
      >
        <Plus size={20} className="text-gray-600" />
      </button>
    </div>
  );
}
