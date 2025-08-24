interface ActionButtonsProps {
  onSave: () => void;
}

export function ActionButtons({ onSave }: ActionButtonsProps) {
  return (
    <div className="flex gap-3 p-6" data-vaul-no-drag>
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