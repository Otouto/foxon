import { useState, useEffect } from 'react';

interface SetValue {
  weight: number;
  reps: number;
}

interface Exercise {
  sets: SetValue[];
}

interface UseSetTrackingReturn {
  completedSets: boolean[];
  setValues: SetValue[];
  toggleSetCompletion: (setIndex: number) => void;
  updateSetValue: (setIndex: number, field: 'weight' | 'reps', value: number) => void;
  addSet: () => void;
}

export function useSetTracking(currentExercise: Exercise | undefined): UseSetTrackingReturn {
  const [completedSets, setCompletedSets] = useState<boolean[]>([]);
  const [setValues, setSetValues] = useState<SetValue[]>([]);

  // Reset state when exercise changes
  useEffect(() => {
    if (currentExercise) {
      setCompletedSets(new Array(currentExercise.sets.length).fill(false));
      setSetValues(currentExercise.sets.map(set => ({ weight: set.weight, reps: set.reps })));
    }
  }, [currentExercise]);

  const toggleSetCompletion = (setIndex: number) => {
    setCompletedSets(prev => {
      const newState = [...prev];
      newState[setIndex] = !newState[setIndex];
      return newState;
    });
  };

  const updateSetValue = (setIndex: number, field: 'weight' | 'reps', value: number) => {
    setSetValues(prev => {
      const newValues = [...prev];
      newValues[setIndex] = { ...newValues[setIndex], [field]: value };
      return newValues;
    });
  };

  const addSet = () => {
    if (!currentExercise || setValues.length === 0) return;
    
    // Get the last set's values as defaults for the new set
    const lastSet = setValues[setValues.length - 1];
    const newSet = { weight: lastSet.weight, reps: lastSet.reps };
    
    // Add new set to state arrays
    setSetValues(prev => [...prev, newSet]);
    setCompletedSets(prev => [...prev, false]);
  };

  return {
    completedSets,
    setValues,
    toggleSetCompletion,
    updateSetValue,
    addSet
  };
}
