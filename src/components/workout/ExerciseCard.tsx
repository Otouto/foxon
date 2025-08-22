'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { SetEditor } from './SetEditor';

interface SetValue {
  weight: number;
  reps: number;
}

interface Exercise {
  name: string;
  sets: SetValue[];
  previousSession?: SetValue[] | null;
}

interface ExerciseCardProps {
  currentExercise: Exercise;
  isBodyweightExercise: boolean;
  completedSets: boolean[];
  setValues: SetValue[];
  toggleSetCompletion: (setIndex: number) => void;
  updateSetValue: (setIndex: number, field: 'weight' | 'reps', value: number) => void;
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

export function ExerciseCard({
  currentExercise,
  isBodyweightExercise,
  completedSets,
  setValues,
  toggleSetCompletion,
  updateSetValue
}: ExerciseCardProps) {
  const [editingSet, setEditingSet] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<{ weight: number; reps: number } | null>(null);

  const handleEditSet = (setIndex: number) => {
    setEditingValues({
      weight: setValues[setIndex]?.weight || 0,
      reps: setValues[setIndex]?.reps || 0
    });
    setEditingSet(setIndex);
  };

  const handleSaveSet = (weight: number, reps: number) => {
    if (editingSet !== null) {
      updateSetValue(editingSet, 'weight', weight);
      updateSetValue(editingSet, 'reps', reps);
    }
    setEditingSet(null);
    setEditingValues(null);
  };

  const handleCancelEdit = () => {
    setEditingSet(null);
    setEditingValues(null);
  };

  const handleToggleSetCompletion = (setIndex: number) => {
    const newCompletionState = !completedSets[setIndex];
    toggleSetCompletion(setIndex);
    
    // Trigger haptic feedback
    if (newCompletionState) {
      triggerHaptic('medium'); // Completed
    } else {
      triggerHaptic('light'); // Uncompleted
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">{currentExercise.name}</h2>
      
      {/* Progress Bar */}
      <div className="mb-4 px-2">
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-lime-400 h-1 rounded-full transition-all duration-300"
            style={{ 
              width: `${(completedSets.filter(Boolean).length / completedSets.length) * 100}%` 
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 text-center">
          {completedSets.filter(Boolean).length} of {completedSets.length} sets completed
        </p>
      </div>
      
      {/* Sets */}
      <div className="space-y-2">
        {setValues.map((set, index) => {
          const hasPreviousData = currentExercise.previousSession && 
                                  currentExercise.previousSession.length > 0 && 
                                  currentExercise.previousSession[index];
          const previousSet = hasPreviousData ? currentExercise.previousSession![index] : null;
          const isCompleted = completedSets[index];
          
          return (
            <div 
              key={index}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                isCompleted 
                  ? 'bg-lime-50 border border-lime-200' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* Check Button - Larger touch target */}
              <button 
                onClick={() => handleToggleSetCompletion(index)}
                className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-200 ${
                  isCompleted
                    ? 'bg-lime-400 hover:bg-lime-500'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`${isCompleted ? 'Uncomplete' : 'Complete'} set ${index + 1}`}
                aria-pressed={isCompleted}
              >
                <Check size={18} className={isCompleted ? "text-black" : "text-gray-500"} />
              </button>
              
              {/* Set Info - Single row layout */}
              <div className="flex-1 flex items-center gap-4">
                {/* Set Number + Previous Badge */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-gray-900 text-lg tabular-nums" aria-label={`Set ${index + 1}`}>
                    {index + 1}
                  </span>
                  {hasPreviousData && previousSet && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full" aria-label={`Previous: ${isBodyweightExercise ? `${previousSet.reps} reps` : `${previousSet.weight}kg × ${previousSet.reps} reps`}`}>
                      {isBodyweightExercise 
                        ? `${previousSet.reps}` 
                        : `${previousSet.weight}kg × ${previousSet.reps}`
                      }
                    </span>
                  )}
                </div>
                
                {/* KG Pill */}
                {!isBodyweightExercise && (
                  <button
                    onClick={() => handleEditSet(index)}
                    className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                      isCompleted
                        ? 'bg-lime-100 text-lime-800 cursor-pointer hover:bg-lime-200'
                        : 'bg-white border border-gray-300 text-gray-900 cursor-pointer hover:bg-gray-50'
                    }`}
                    aria-label={`Edit weight for set ${index + 1}. Current weight: ${setValues[index]?.weight || set.weight}kg`}
                  >
                    <span className="tabular-nums">{setValues[index]?.weight || set.weight}</span>
                    <span className="text-sm ml-1">kg</span>
                  </button>
                )}
                
                {/* REPS Pill */}
                <button
                  onClick={() => handleEditSet(index)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                    isCompleted
                      ? 'bg-lime-100 text-lime-800 cursor-pointer hover:bg-lime-200'
                      : 'bg-white border border-gray-300 text-gray-900 cursor-pointer hover:bg-gray-50'
                  }`}
                  aria-label={`Edit reps for set ${index + 1}. Current reps: ${setValues[index]?.reps || set.reps}`}
                >
                  <span className="tabular-nums">{setValues[index]?.reps || set.reps}</span>
                  <span className="text-sm ml-1">reps</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Set Editor Bottom Sheet */}
      {editingSet !== null && editingValues && (
        <SetEditor
          isOpen={editingSet !== null}
          onClose={handleCancelEdit}
          onSave={handleSaveSet}
          initialWeight={editingValues.weight}
          initialReps={editingValues.reps}
          isBodyweightExercise={isBodyweightExercise}
          previousValues={
            currentExercise.previousSession?.[editingSet] 
              ? {
                  weight: currentExercise.previousSession[editingSet].weight,
                  reps: currentExercise.previousSession[editingSet].reps
                }
              : null
          }
        />
      )}
    </div>
  );
}
