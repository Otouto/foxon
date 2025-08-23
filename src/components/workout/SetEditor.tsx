'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Drawer } from 'vaul';
import { WheelPicker, WheelPickerWrapper } from '@ncdai/react-wheel-picker';
import '@ncdai/react-wheel-picker/style.css';

interface SetEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weight: number, reps: number) => void;
  initialWeight: number;
  initialReps: number;
  isBodyweightExercise: boolean;
  previousValues?: { weight: number; reps: number } | null;
}

// Haptic feedback utility
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
    }
  }
};

export function SetEditor({
  isOpen,
  onClose,
  onSave,
  initialWeight,
  initialReps,
  isBodyweightExercise,
  previousValues
}: SetEditorProps) {
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [isInteractingWithWheel, setIsInteractingWithWheel] = useState(false);

  // Reset values when opening
  useEffect(() => {
    if (isOpen) {
      setWeight(initialWeight);
      setReps(initialReps);
      console.log('SetEditor opened with values:', { weight: initialWeight, reps: initialReps });
    }
  }, [isOpen, initialWeight, initialReps]);

  const handleSave = () => {
    triggerHaptic('medium');
    onSave(weight, reps);
  };

  const handleResetToPrevious = () => {
    if (previousValues) {
      triggerHaptic('light');
      setWeight(previousValues.weight);
      setReps(previousValues.reps);
    }
  };

  const handleWeightChange = (newWeight: string) => {
    const weightNum = parseFloat(newWeight);
    if (weightNum !== weight) {
      triggerHaptic('light');
      setWeight(weightNum);
    }
  };

  const handleRepsChange = (newReps: string) => {
    const repsNum = parseInt(newReps);
    if (repsNum !== reps) {
      triggerHaptic('light');
      setReps(repsNum);
    }
  };

  // Generate weight options (0.5kg increments from 0 to 200kg)
  const weightOptions = Array.from({ length: 401 }, (_, i) => {
    const weight = i * 0.5;
    return {
      value: weight.toString(),
      label: weight % 1 === 0 ? weight.toString() : weight.toFixed(1)
    };
  });
  
  // Generate rep options (1 to 100)
  const repOptions = Array.from({ length: 100 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString().padStart(2, "0")
  }));

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose} shouldScaleBackground={false} dismissible={!isInteractingWithWheel}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content 
          className="bg-white flex flex-col rounded-t-[10px] h-[60vh] mt-16 fixed bottom-0 left-0 right-0 z-50"
          onInteractOutside={(e) => e.preventDefault()}
        >
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

          {/* Labels */}
          <div className="flex justify-center gap-16 px-6 mb-4">
            {!isBodyweightExercise && (
              <div className="text-center">
                <label className="text-sm font-medium text-gray-600">Weight (kg)</label>
              </div>
            )}
            <div className="text-center">
              <label className="text-sm font-medium text-gray-600">Reps</label>
            </div>
          </div>

          {/* Wheel Pickers */}
          <div 
            className="flex-1 flex items-center justify-center px-6 mb-4"
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsInteractingWithWheel(true);
            }}
            onPointerMove={(e) => {
              e.stopPropagation();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              setIsInteractingWithWheel(false);
            }}
            onPointerCancel={(e) => {
              e.stopPropagation();
              setIsInteractingWithWheel(false);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <div className="w-64">
              <WheelPickerWrapper>
                {!isBodyweightExercise && (
                  <WheelPicker
                    value={weight.toString()}
                    onValueChange={handleWeightChange}
                    options={weightOptions}
                    infinite
                  />
                )}
                <WheelPicker
                  value={reps.toString()}
                  onValueChange={handleRepsChange}
                  options={repOptions}
                  infinite
                />
              </WheelPickerWrapper>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 p-6 border-t border-gray-100">
            {previousValues && (
              <button
                onClick={handleResetToPrevious}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                aria-label="Reset to previous values"
              >
                <RotateCcw size={16} />
                Reset to Previous
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex-1 bg-lime-400 text-black font-semibold py-3 rounded-xl hover:bg-lime-500 transition-colors"
              aria-label="Save changes"
            >
              Done
            </button>
          </div>

          {/* Safe area padding for mobile */}
          <div className="h-safe-area-inset-bottom" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
