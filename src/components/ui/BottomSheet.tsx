'use client';

import { Drawer } from 'vaul';
import { ReactNode } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissible?: boolean;
  showHandle?: boolean;
  maxHeight?: string;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  dismissible = true,
  showHandle = true,
  maxHeight = 'max-h-[85vh]',
  className = ''
}: BottomSheetProps) {
  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose} shouldScaleBackground={false} dismissible={dismissible}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Drawer.Content
          className={`bg-white flex flex-col overflow-hidden rounded-t-3xl fixed bottom-0 left-0 right-0 z-[60] outline-none ${maxHeight} ${className}`}
          aria-describedby={undefined}
        >
          {showHandle && (
            <div className="flex-shrink-0 mx-auto w-12 h-1.5 bg-gray-300 rounded-full mt-4 mb-2" aria-hidden="true" />
          )}
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// Export Drawer.Title for use in child components
export const BottomSheetTitle = Drawer.Title;
export const BottomSheetDescription = Drawer.Description;
