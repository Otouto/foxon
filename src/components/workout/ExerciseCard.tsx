'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { SetEditor } from './SetEditor';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

interface SetValue {
  weight: number;
  reps: number;
}

interface Exercise {
  name: string;
  sets: SetValue[];
}

interface ExerciseCardProps {
  currentExercise: Exercise;
  isBodyweightExercise: boolean;
  completedSets: boolean[];
  setValues: SetValue[];
  toggleSetCompletion: (setIndex: number) => void;
  updateSetValue: (setIndex: number, field: 'weight' | 'reps', value: number) => void;
}

export function ExerciseCard({
  currentExercise,
  isBodyweightExercise,
  completedSets,
  setValues,
  toggleSetCompletion,
  updateSetValue
}: ExerciseCardProps) {
  const { triggerHaptic } = useHapticFeedback();
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
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">{currentExercise.name}</h2>
      
      
      {/* Sets */}
      <div className="space-y-1.5">
        {setValues.map((set, index) => {
          const isCompleted = completedSets[index];
          
          return (
            <div 
              key={index}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                isCompleted 
                  ? 'bg-lime-50 border border-lime-200' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
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
              
              {/* Set Info - Entire area tappable for editing */}
              <div 
                onClick={() => handleEditSet(index)}
                className="flex-1 flex items-center gap-4 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleEditSet(index);
                  }
                }}
                aria-label={`Edit set ${index + 1}. Current: ${isBodyweightExercise ? `${setValues[index]?.reps || set.reps} reps` : `${setValues[index]?.weight || set.weight}kg, ${setValues[index]?.reps || set.reps} reps`}`}
              >
                {/* Set Number */}
                <div className="flex items-center min-w-0">
                  <span className="font-semibold text-gray-900 text-lg tabular-nums" aria-hidden="true">
                    {index + 1}
                  </span>
                </div>
                
                {/* KG Pill - Visual only, no individual click handler */}
                {!isBodyweightExercise && (
                  <div
                    className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                      isCompleted
                        ? 'bg-lime-100 text-lime-800 border border-transparent'
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                  >
                    <span className="tabular-nums">{setValues[index]?.weight || set.weight}</span>
                    <span className="text-sm ml-1">kg</span>
                  </div>
                )}
                
                {/* REPS Pill - Visual only, no individual click handler */}
                <div
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                    isCompleted
                      ? 'bg-lime-100 text-lime-800 border border-transparent'
                      : 'bg-white border border-gray-300 text-gray-900'
                  }`}
                >
                  <span className="tabular-nums">{setValues[index]?.reps || set.reps}</span>
                  <span className="text-sm ml-1">reps</span>
                </div>
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
          setNumber={editingSet + 1}
        />
      )}
    </div>
  );
}
