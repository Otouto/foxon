'use client';

import { useState, useEffect } from 'react';
import { Search, X, Dumbbell } from 'lucide-react';
import type { ExerciseListItem } from '@/lib/types/exercise';

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
  const [isLoading, setIsLoading] = useState(false);

  // Fetch exercises when modal opens
  useEffect(() => {
    if (isOpen && exercises.length === 0) {
      fetchExercises();
    }
  }, [isOpen, exercises.length]);

  // Filter exercises based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredExercises(exercises);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = exercises.filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(query) ||
          (exercise.muscleGroup && exercise.muscleGroup.toLowerCase().includes(query))
      );
      setFilteredExercises(filtered);
    }
  }, [searchQuery, exercises]);

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

  const handleSelectExercise = (exercise: ExerciseListItem) => {
    onSelectExercise(exercise);
    onClose();
    setSearchQuery(''); // Reset search when closing
  };

  const handleClose = () => {
    onClose();
    setSearchQuery(''); // Reset search when closing
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-end justify-center z-[9999] sm:items-center sm:p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full h-[85vh] sm:h-[80vh] sm:max-w-lg sm:max-h-[600px] shadow-2xl transform transition-all flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Add Exercise</h2>
          <button
            onClick={handleClose}
            className="p-2 -m-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

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
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading exercises...</span>
            </div>
          ) : filteredExercises.length === 0 ? (
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
            <div className="space-y-2">
              {filteredExercises.map((exercise) => (
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}