'use client';

import { useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { SetEditor } from './SetEditor';
import { isBodyweightExercise, hasBodyweightSets } from '@/lib/utils/exerciseUtils';
import type { WorkoutExerciseItem } from '@/hooks/useWorkoutCreation';

interface WorkoutExerciseCardProps {
  exercise: WorkoutExerciseItem;
  onRemove: () => void;
  onAddSet: () => void;
  onRemoveSet: (setOrder: number) => void;
  onUpdateSet: (setOrder: number, field: 'targetLoad' | 'targetReps' | 'type', value: number | 'WARMUP' | 'NORMAL') => void;
  onUpdateNotes: (notes: string) => void;
}

export function WorkoutExerciseCard({
  exercise,
  onRemove,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onUpdateNotes, // Future feature for exercise notes
}: WorkoutExerciseCardProps) {
  const [editingSet, setEditingSet] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<{ weight: number; reps: number } | null>(null);

  // Check if this is a bodyweight exercise using centralized logic
  const isBodyweight = isBodyweightExercise(exercise.exercise) || hasBodyweightSets(exercise.sets);

  const handleEditSet = (setOrder: number) => {
    const set = exercise.sets.find(s => s.order === setOrder);
    if (set) {
      setEditingValues({
        weight: set.targetLoad,
        reps: set.targetReps
      });
      setEditingSet(setOrder);
    }
  };

  const handleSaveSet = (weight: number, reps: number) => {
    if (editingSet !== null) {
      onUpdateSet(editingSet, 'targetLoad', weight);
      onUpdateSet(editingSet, 'targetReps', reps);
    }
    setEditingSet(null);
    setEditingValues(null);
  };

  const handleCancelEdit = () => {
    setEditingSet(null);
    setEditingValues(null);
  };

  const handleToggleSetType = (setOrder: number) => {
    const set = exercise.sets.find(s => s.order === setOrder);
    if (set) {
      const newType = set.type === 'WARMUP' ? 'NORMAL' : 'WARMUP';
      onUpdateSet(setOrder, 'type', newType);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {exercise.exercise.name}
          </h3>
          {exercise.exercise.muscleGroup && (
            <p className="text-sm text-gray-600">
              {exercise.exercise.muscleGroup}
              {exercise.exercise.equipment && ` • ${exercise.exercise.equipment}`}
            </p>
          )}
        </div>
        <button
          onClick={onRemove}
          className="p-2 -m-2 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Remove exercise"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Sets */}
      <div className="space-y-2 mb-4">
        {exercise.sets.map((set, index) => (
          <div
            key={set.order}
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              set.type === 'WARMUP'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            {/* Set Number */}
            <div className="flex items-center min-w-0">
              <span className="font-semibold text-gray-900 text-lg tabular-nums w-6 text-center">
                {index + 1}
              </span>
            </div>

            {/* Set Type Toggle - W for Warmup, N for Normal */}
            <button
              onClick={() => handleToggleSetType(set.order)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                set.type === 'WARMUP'
                  ? 'bg-orange-200 text-orange-800 hover:bg-orange-300'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={set.type === 'WARMUP' ? 'Warmup set' : 'Normal set'}
            >
              {set.type === 'WARMUP' ? 'W' : 'N'}
            </button>

            {/* Set Configuration - Clickable to edit */}
            <div
              onClick={() => handleEditSet(set.order)}
              className="flex-1 flex items-center gap-2 cursor-pointer hover:bg-white hover:border-cyan-400 rounded-lg p-2 -m-2 transition-all"
              role="button"
              tabIndex={0}
              title="Tap to edit set"
            >
              {/* Weight Pill - Only show for weighted exercises */}
              {!isBodyweight && (
                <div className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm font-medium">
                  <span className="tabular-nums">{set.targetLoad}</span>
                  <span className="text-xs ml-1">kg</span>
                </div>
              )}

              {/* Reps Pill */}
              <div className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm font-medium">
                <span className="tabular-nums">{set.targetReps}</span>
                <span className="text-xs ml-1">reps</span>
              </div>
            </div>

            {/* Remove Set */}
            {exercise.sets.length > 1 && (
              <button
                onClick={() => onRemoveSet(set.order)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove set"
              >
                <Minus size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Set Button */}
      <button
        onClick={onAddSet}
        className="w-full p-3 border border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        <span className="font-medium">Add Set</span>
      </button>

      {/* Set Editor Bottom Sheet */}
      {editingSet !== null && editingValues && (
        <SetEditor
          isOpen={editingSet !== null}
          onClose={handleCancelEdit}
          onSave={handleSaveSet}
          initialWeight={editingValues.weight}
          initialReps={editingValues.reps}
          isBodyweightExercise={isBodyweight}
          setNumber={editingSet}
        />
      )}
    </div>
  );
}