'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Save, FileText } from 'lucide-react';
import { useWorkoutCreation } from '@/hooks/useWorkoutCreation';
import { ExerciseSelectionModal } from '@/components/workout/ExerciseSelectionModal';
import { WorkoutExerciseCard } from '@/components/workout/WorkoutExerciseCard';

function CreateWorkoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editWorkoutId = searchParams.get('edit');
  const isEditing = Boolean(editWorkoutId);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);

  const {
    workoutName,
    exercises,
    isModalOpen,
    isSaving,
    canSave,
    updateWorkoutName,
    openExerciseModal,
    closeExerciseModal,
    addExercise,
    removeExercise,
    updateExerciseNotes,
    addSet,
    removeSet,
    updateSet,
    saveWorkout,
    loadWorkoutForEditing,
  } = useWorkoutCreation();

  // Load existing workout data when in edit mode
  useEffect(() => {
    const loadWorkoutData = async () => {
      if (editWorkoutId && isEditing) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/workouts/${editWorkoutId}`);

          if (!response.ok) {
            throw new Error('Failed to fetch workout data');
          }

          const workoutData = await response.json();
          loadWorkoutForEditing(workoutData);
        } catch (error) {
          console.error('Failed to load workout for editing:', error);
          setSaveError('Failed to load workout data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadWorkoutData();
  }, [editWorkoutId, isEditing, loadWorkoutForEditing]);

  const handleSaveWorkout = async (asDraft: boolean = false) => {
    try {
      setSaveError(null);
      setSaveSuccess(null);

      await saveWorkout(asDraft, editWorkoutId || undefined);

      const successMessage = isEditing
        ? (asDraft ? 'Workout draft updated successfully!' : 'Workout updated successfully!')
        : (asDraft ? 'Draft saved successfully!' : 'Workout created successfully!');

      setSaveSuccess(successMessage);

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/workout');
      }, 1500);
    } catch (error) {
      console.error('Failed to save workout:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save workout');
    }
  };

  // Show loading state while fetching workout data for editing
  if (isLoading) {
    return (
      <div className="px-6 py-8 pb-above-nav">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/workout" className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Loading Workout...</h1>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-cyan-400 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 pb-above-nav">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/workout" className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Workout' : 'Create Workout'}
        </h1>
      </div>

      {/* Workout Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Workout Name
        </label>
        <input
          type="text"
          placeholder="e.g., Push Day"
          value={workoutName}
          onChange={(e) => updateWorkoutName(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
        />
      </div>

      {/* Exercises */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Exercises</h2>
          <button
            onClick={openExerciseModal}
            className="bg-cyan-400 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-cyan-500 transition-colors"
          >
            <Plus size={16} />
            Add Exercise
          </button>
        </div>

        {/* Exercise List or Empty State */}
        {exercises.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💪</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">No exercises yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Tap the &ldquo;Add Exercise&rdquo; button to add exercises to your workout
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise) => (
              <WorkoutExerciseCard
                key={exercise.id}
                exercise={exercise}
                onRemove={() => removeExercise(exercise.id)}
                onAddSet={() => addSet(exercise.id)}
                onRemoveSet={(setOrder) => removeSet(exercise.id, setOrder)}
                onUpdateSet={(setOrder, field, value) => updateSet(exercise.id, setOrder, field, value)}
                onUpdateNotes={(notes) => updateExerciseNotes(exercise.id, notes)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status Messages */}
      {saveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm font-medium">{saveError}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-700 text-sm font-medium">{saveSuccess}</p>
        </div>
      )}

      {/* Save Buttons */}
      <div className="fixed bottom-above-nav left-6 right-6">
        <div className="flex gap-3">
          <button
            onClick={() => handleSaveWorkout(true)}
            disabled={!canSave || isSaving}
            className="flex-1 bg-gray-400 text-white font-semibold py-4 rounded-2xl hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <FileText size={18} />
                <span>Save as Draft</span>
              </>
            )}
          </button>
          <button
            onClick={() => handleSaveWorkout(false)}
            disabled={!canSave || isSaving}
            className="flex-1 bg-lime-400 text-black font-semibold py-4 rounded-2xl hover:bg-lime-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={18} />
                <span>{isEditing ? 'Update Workout' : 'Create Workout'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Exercise Selection Modal */}
      <ExerciseSelectionModal
        isOpen={isModalOpen}
        onClose={closeExerciseModal}
        onSelectExercise={addExercise}
      />
    </div>
  );
}

export default function CreateWorkoutPage() {
  return (
    <Suspense fallback={<div className="px-6 py-8 pb-above-nav">Loading...</div>}>
      <CreateWorkoutPageInner />
    </Suspense>
  );
}
