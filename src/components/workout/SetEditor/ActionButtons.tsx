import { RotateCcw } from 'lucide-react';

interface SetValues {
  weight: number;
  reps: number;
}

interface ActionButtonsProps {
  previousValues?: SetValues | null;
  onResetToPrevious: () => void;
  onSave: () => void;
}

export function ActionButtons({ previousValues, onResetToPrevious, onSave }: ActionButtonsProps) {
  return (
    <div className="flex gap-3 p-6 border-t border-gray-100" data-vaul-no-drag>
      {previousValues && (
        <button
          onClick={onResetToPrevious}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          aria-label="Reset to previous values"
          tabIndex={0}
        >
          <RotateCcw size={16} />
          Reset to Previous
        </button>
      )}
      <button
        onClick={onSave}
        className="flex-1 bg-lime-400 text-black font-semibold py-3 rounded-xl hover:bg-lime-500 transition-colors"
        aria-label="Save changes"
        tabIndex={0}
      >
        Done
      </button>
    </div>
  );
}