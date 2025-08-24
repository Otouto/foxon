'use client';

import { Drawer } from 'vaul';
import '@ncdai/react-wheel-picker/style.css';
import { usePickerOptions } from '../../hooks/usePickerOptions';
import { useSetEditorState } from '../../hooks/useSetEditorState';
import { DrawerHeader } from './SetEditor/DrawerHeader';
import { PickerSection } from './SetEditor/PickerSection';
import { ActionButtons } from './SetEditor/ActionButtons';

interface SetEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weight: number, reps: number) => void;
  initialWeight: number;
  initialReps: number;
  isBodyweightExercise: boolean;
  setNumber: number;
}

export function SetEditor({
  isOpen,
  onClose,
  onSave,
  initialWeight,
  initialReps,
  isBodyweightExercise,
  setNumber
}: SetEditorProps) {
  const { weightOptions, repOptions } = usePickerOptions();
  
  const {
    weight,
    reps,
    isInteractingWithWheel,
    setIsInteractingWithWheel,
    handleWeightChange,
    handleRepsChange,
    handleSave,
  } = useSetEditorState({
    isOpen,
    initialWeight,
    initialReps,
    onSave,
  });

  return (
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={onClose} 
      shouldScaleBackground={false} 
      dismissible={!isInteractingWithWheel}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content 
          className="bg-white flex flex-col rounded-t-[10px] h-[60vh] mt-16 fixed bottom-0 left-0 right-0 z-50"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DrawerHeader onClose={onClose} setNumber={setNumber} />
          
          <PickerSection
            isBodyweightExercise={isBodyweightExercise}
            weight={weight}
            reps={reps}
            weightOptions={weightOptions}
            repOptions={repOptions}
            onWeightChange={handleWeightChange}
            onRepsChange={handleRepsChange}
            onInteractionStart={() => setIsInteractingWithWheel(true)}
            onInteractionEnd={() => setIsInteractingWithWheel(false)}
          />
          
          <ActionButtons
            onSave={handleSave}
          />

          {/* Safe area padding for mobile */}
          <div className="h-safe-area-inset-bottom" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}