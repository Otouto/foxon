import { X } from 'lucide-react';
import { Drawer } from 'vaul';

interface DrawerHeaderProps {
  onClose: () => void;
}

export function DrawerHeader({ onClose }: DrawerHeaderProps) {
  return (
    <>
      {/* Handle */}
      <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-4 mt-3" />
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 mb-4">
        <Drawer.Title className="text-lg font-semibold text-gray-900">Edit Set</Drawer.Title>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close editor"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>
      
      <Drawer.Description className="sr-only">
        Edit the weight and repetitions for your exercise set using the wheel pickers below
      </Drawer.Description>
    </>
  );
}