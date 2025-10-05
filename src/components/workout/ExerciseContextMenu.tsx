'use client';

import { X, Link2, Link, MoveRight, LogOut, Trash2 } from 'lucide-react';

interface ExerciseContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  isInBlock: boolean;
  currentBlockId?: string;
  availableBlocks: Array<{ id: string; label: string }>;
  onCreateBlock: () => void;
  onAddToBlock: (blockId: string) => void;
  onMoveToBlock: (blockId: string) => void;
  onRemoveFromBlock: () => void;
  onDelete: () => void;
}

export function ExerciseContextMenu({
  isOpen,
  onClose,
  exerciseId,
  exerciseName,
  isInBlock,
  currentBlockId,
  availableBlocks,
  onCreateBlock,
  onAddToBlock,
  onMoveToBlock,
  onRemoveFromBlock,
  onDelete,
}: ExerciseContextMenuProps) {
  if (!isOpen) return null;

  // Filter out current block from available blocks
  const otherBlocks = availableBlocks.filter(block => block.id !== currentBlockId);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-end"
      onClick={onClose}
    >
      {/* Bottom Sheet */}
      <div
        className="bg-white w-full rounded-t-3xl shadow-xl transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {exerciseName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Exercise options
            </p>
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
          {!isInBlock ? (
            <>
              {/* Create New Block */}
              <button
                onClick={() => handleAction(onCreateBlock)}
                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <Link2 size={20} className="text-gray-700 flex-shrink-0" />
                <span className="text-gray-900 font-medium">Create New Block</span>
              </button>

              {/* Add to Existing Blocks */}
              {availableBlocks.map(block => (
                <button
                  key={block.id}
                  onClick={() => handleAction(() => onAddToBlock(block.id))}
                  className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <Link size={20} className="text-gray-700 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">Add to {block.label}</span>
                </button>
              ))}
            </>
          ) : (
            <>
              {/* Remove from Block */}
              <button
                onClick={() => handleAction(onRemoveFromBlock)}
                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <LogOut size={20} className="text-gray-700 flex-shrink-0" />
                <span className="text-gray-900 font-medium">Remove from Block</span>
              </button>

              {/* Move to Other Blocks */}
              {otherBlocks.map(block => (
                <button
                  key={block.id}
                  onClick={() => handleAction(() => onMoveToBlock(block.id))}
                  className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <MoveRight size={20} className="text-gray-700 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">Move to {block.label}</span>
                </button>
              ))}
            </>
          )}

          {/* Divider */}
          <div className="my-2 border-t border-gray-100"></div>

          {/* Delete Exercise */}
          <button
            onClick={() => handleAction(onDelete)}
            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-red-600 font-medium">Delete Exercise</span>
          </button>
        </div>

        {/* Bottom Padding for safe area */}
        <div className="pb-safe h-6"></div>
      </div>
    </div>
  );
}
