'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ExerciseBlockContainerProps {
  blockId: string;
  blockLabel: string;
  children: ReactNode;
  onDissolveBlock: () => void;
}

export function ExerciseBlockContainer({
  blockId: _blockId,
  blockLabel,
  children,
  onDissolveBlock,
}: ExerciseBlockContainerProps) {
  return (
    <div className="border-2 border-cyan-200 bg-cyan-50/30 rounded-3xl p-4 relative">
      {/* Block Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔗</span>
          <h3 className="text-base font-semibold text-gray-900">
            {blockLabel}
          </h3>
        </div>
        <button
          onClick={onDissolveBlock}
          className="p-1.5 hover:bg-cyan-100 rounded-full transition-colors"
          aria-label="Dissolve block"
          title="Dissolve block - exercises will become standalone"
        >
          <X size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Exercise Cards */}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}
