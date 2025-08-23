import { useState, useEffect, useCallback } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

interface SetEditorValues {
  weight: number;
  reps: number;
}

interface UseSetEditorStateProps {
  isOpen: boolean;
  initialWeight: number;
  initialReps: number;
  onSave: (weight: number, reps: number) => void;
  previousValues?: SetEditorValues | null;
}

interface UseSetEditorStateReturn {
  weight: number;
  reps: number;
  isInteractingWithWheel: boolean;
  setIsInteractingWithWheel: (value: boolean) => void;
  handleWeightChange: (newWeight: string) => void;
  handleRepsChange: (newReps: string) => void;
  handleSave: () => void;
  handleResetToPrevious: () => void;
}

export function useSetEditorState({
  isOpen,
  initialWeight,
  initialReps,
  onSave,
  previousValues,
}: UseSetEditorStateProps): UseSetEditorStateReturn {
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [isInteractingWithWheel, setIsInteractingWithWheel] = useState(false);
  
  const { triggerHaptic } = useHapticFeedback();

  // Reset values when opening
  useEffect(() => {
    if (isOpen) {
      setWeight(initialWeight);
      setReps(initialReps);
    }
  }, [isOpen, initialWeight, initialReps]);

  const handleWeightChange = useCallback((newWeight: string) => {
    const weightNum = parseFloat(newWeight);
    if (!isNaN(weightNum) && weightNum !== weight) {
      triggerHaptic('light');
      setWeight(weightNum);
    }
  }, [weight, triggerHaptic]);

  const handleRepsChange = useCallback((newReps: string) => {
    const repsNum = parseInt(newReps, 10);
    if (!isNaN(repsNum) && repsNum !== reps) {
      triggerHaptic('light');
      setReps(repsNum);
    }
  }, [reps, triggerHaptic]);

  const handleSave = useCallback(() => {
    triggerHaptic('medium');
    onSave(weight, reps);
  }, [weight, reps, onSave, triggerHaptic]);

  const handleResetToPrevious = useCallback(() => {
    if (previousValues) {
      triggerHaptic('light');
      setWeight(previousValues.weight);
      setReps(previousValues.reps);
    }
  }, [previousValues, triggerHaptic]);

  return {
    weight,
    reps,
    isInteractingWithWheel,
    setIsInteractingWithWheel,
    handleWeightChange,
    handleRepsChange,
    handleSave,
    handleResetToPrevious,
  };
}