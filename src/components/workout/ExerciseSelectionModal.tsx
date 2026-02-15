'use client';

import { useState, useEffect } from 'react';
import { Search, X, Dumbbell, Plus, ArrowLeft } from 'lucide-react';
import { BottomSheet, BottomSheetTitle } from '@/components/ui/BottomSheet';
import { ImageUploadField } from '@/components/exercise/ImageUploadField';
import type { ExerciseListItem } from '@/lib/types/exercise';

interface MuscleGroup {
  id: string;
  name: string;
}

interface Equipment {
  id: string;
  name: string;
}

interface ExerciseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseListItem) => void;
}

export function ExerciseSelectionModal({
  isOpen,
  onClose,
  onSelectExercise
}: ExerciseSelectionModalProps) {
  const [exercises, setExercises] = useState<ExerciseListItem[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [createForm, setCreateForm] = useState({
    name: '',
    muscleGroupId: '',
    equipmentId: '',
    instructions: '',
    imageUrl: null as string | null
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch exercises when modal opens
  useEffect(() => {
    if (isOpen && exercises.length === 0) {
      fetchExercises();
      fetchMuscleGroups();
      fetchEquipment();
    }
  }, [isOpen, exercises.length]);

  // Filter exercises based on debounced search query
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setFilteredExercises(exercises);
    } else {
      const query = debouncedSearchQuery.toLowerCase();
      const filtered = exercises.filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(query) ||
          (exercise.muscleGroup && exercise.muscleGroup.toLowerCase().includes(query))
      );
      setFilteredExercises(filtered);
    }
  }, [debouncedSearchQuery, exercises]);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/exercises');
      if (response.ok) {
        const data = await response.json();
        setExercises(data.exercises);
        setFilteredExercises(data.exercises);
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMuscleGroups = async () => {
    try {
      const response = await fetch('/api/muscle-groups');
      if (response.ok) {
        const data = await response.json();
        setMuscleGroups(data.muscleGroups);
      }
    } catch (error) {
      console.error('Failed to fetch muscle groups:', error);
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.equipment);
      }
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    }
  };

  const createExercise = async () => {
    if (!createForm.name.trim()) {
      setCreateError('Exercise name is required');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createForm.name.trim(),
          muscleGroupId: createForm.muscleGroupId || null,
          equipmentId: createForm.equipmentId || null,
          instructions: createForm.instructions?.trim() || null,
          imageUrl: createForm.imageUrl || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newExercise = data.exercise;

        // Add to exercises list
        setExercises(prev => [...prev, newExercise]);

        // Select the new exercise and close modal
        onSelectExercise(newExercise);
        handleClose();
      } else {
        const errorData = await response.json();
        setCreateError(errorData.error || 'Failed to create exercise');
      }
    } catch (error) {
      console.error('Failed to create exercise:', error);
      setCreateError('Failed to create exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectExercise = (exercise: ExerciseListItem) => {
    onSelectExercise(exercise);
    onClose();
    setSearchQuery(''); // Reset search when closing
  };

  const handleClose = () => {
    onClose();
    setSearchQuery(''); // Reset search when closing
    setIsCreating(false);
    setCreateForm({
      name: '',
      muscleGroupId: '',
      equipmentId: '',
      instructions: '',
      imageUrl: null
    });
    setCreateError(null);
  };

  const handleStartCreation = () => {
    setIsCreating(true);
    setCreateForm({
      name: debouncedSearchQuery.trim(),
      muscleGroupId: '',
      equipmentId: '',
      instructions: '',
      imageUrl: null
    });
    setCreateError(null);
  };

  const handleCancelCreation = () => {
    setIsCreating(false);
    setCreateForm({
      name: '',
      muscleGroupId: '',
      equipmentId: '',
      instructions: '',
      imageUrl: null
    });
    setCreateError(null);
  };

  if (!isOpen) return null;

  const showCreateOption = debouncedSearchQuery.trim() && filteredExercises.length === 0 && !isLoading;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={!isCreating ? handleClose : () => {}}
      dismissible={!isCreating}
      maxHeight="h-[85vh] sm:h-[80vh]"
      className="sm:rounded-3xl sm:max-w-lg sm:mx-auto sm:relative"
    >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between p-6 border-b border-gray-100">
          {isCreating ? (
            <>
              <button
                onClick={handleCancelCreation}
                className="p-2 -m-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <BottomSheetTitle className="text-xl font-semibold text-gray-900">Create Exercise</BottomSheetTitle>
              <div className="w-10" /> {/* Spacer */}
            </>
          ) : (
            <>
              <BottomSheetTitle className="text-xl font-semibold text-gray-900">Add Exercise</BottomSheetTitle>
              <button
                onClick={handleClose}
                className="p-2 -m-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </>
          )}
        </div>

        {isCreating ? (
          /* Exercise Creation Form */
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Exercise Name */}
              <div>
                <label htmlFor="exerciseName" className="block text-sm font-medium text-gray-900 mb-2">
                  Exercise Name *
                </label>
                <input
                  id="exerciseName"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  placeholder="Enter exercise name"
                  autoFocus
                />
              </div>

              {/* Muscle Group */}
              <div>
                <label htmlFor="muscleGroup" className="block text-sm font-medium text-gray-900 mb-2">
                  Muscle Group
                </label>
                <select
                  id="muscleGroup"
                  value={createForm.muscleGroupId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, muscleGroupId: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                >
                  <option value="">Select muscle group (optional)</option>
                  {muscleGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipment */}
              <div>
                <label htmlFor="equipment" className="block text-sm font-medium text-gray-900 mb-2">
                  Equipment
                </label>
                <select
                  id="equipment"
                  value={createForm.equipmentId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, equipmentId: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                >
                  <option value="">Select equipment (optional)</option>
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instructions */}
              <div>
                <label htmlFor="instructions" className="block text-sm font-medium text-gray-900 mb-2">
                  Instructions
                </label>
                <textarea
                  id="instructions"
                  value={createForm.instructions}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="How to perform this exercise (optional)"
                />
              </div>

              {/* Image Upload */}
              <ImageUploadField
                value={createForm.imageUrl}
                onChange={(url) => setCreateForm(prev => ({ ...prev, imageUrl: url }))}
                disabled={isSubmitting}
              />

              {/* Error Message */}
              {createError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="text-sm text-red-600">{createError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancelCreation}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 text-gray-600 bg-gray-100 rounded-2xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={createExercise}
                  disabled={isSubmitting || !createForm.name.trim()}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-2xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create & Add'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Exercise List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">Loading exercises...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Create Exercise Card */}
                  {showCreateOption && (
                    <button
                      onClick={handleStartCreation}
                      className="w-full p-4 border-2 border-dashed border-cyan-300 bg-cyan-50 rounded-2xl text-left hover:border-cyan-400 hover:bg-cyan-100 transition-all duration-200 group"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center mr-3">
                          <Plus size={16} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-cyan-700 group-hover:text-cyan-800 transition-colors">
                            Create &ldquo;{debouncedSearchQuery}&rdquo;
                          </h3>
                          <p className="text-sm text-cyan-600 mt-1">
                            Add this exercise to your collection
                          </p>
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Existing Exercises */}
                  {filteredExercises.length === 0 && !showCreateOption ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Dumbbell size={24} className="text-gray-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">No exercises found</h3>
                      <p className="text-sm text-gray-500">
                        {searchQuery ? 'Try adjusting your search terms.' : 'No exercises available.'}
                      </p>
                    </div>
                  ) : (
                    filteredExercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => handleSelectExercise(exercise)}
                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-left hover:border-cyan-400 hover:bg-cyan-50 transition-all duration-200 group"
                      >
                        <h3 className="font-medium text-gray-900 group-hover:text-cyan-700 transition-colors">
                          {exercise.name}
                        </h3>
                        {exercise.muscleGroup && (
                          <p className="text-sm text-gray-600 mt-1">
                            {exercise.muscleGroup}
                            {exercise.equipment && ` • ${exercise.equipment}`}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
    </BottomSheet>
  );
}