'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';

interface WorkoutGroupHeaderProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function WorkoutGroupHeader({ title, count, isExpanded, onToggle }: WorkoutGroupHeaderProps) {
  const getSummaryText = () => {
    return `${count} workout${count !== 1 ? 's' : ''}`;
  };

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-2 pl-[5px] rounded-xl hover:bg-gray-50 transition-colors"
    >
      <div className="text-left">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <p className="text-xs text-gray-600">
          {getSummaryText()}
        </p>
      </div>
      <div className="flex items-center justify-center">
        {isExpanded ? (
          <ChevronDown size={16} className="text-gray-500" />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
      </div>
    </button>
  );
}