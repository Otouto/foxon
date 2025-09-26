'use client';

import { useState, useCallback } from 'react';
import { isBodyweightExercise } from '@/lib/utils/exerciseUtils';
import type { ExerciseListItem } from '@/lib/types/exercise';
import type { WorkoutDetails } from '@/lib/types/workout';

export interface WorkoutSet {
  type: 'WARMUP' | 'NORMAL';
  targetLoad: number;
  targetReps: number;
  order: number;
}

export interface WorkoutExerciseItem {
  id: string; // temporary ID for UI
  exercise: ExerciseListItem;
  sets: WorkoutSet[];
  notes?: string;
}

export interface UseWorkoutCreationState {
  workoutName: string;
  exercises: WorkoutExerciseItem[];
  isModalOpen: boolean;
  isSaving: boolean;
}

export function useWorkoutCreation() {
  const [state, setState] = useState<UseWorkoutCreationState>({
    workoutName: '',
    exercises: [],
    isModalOpen: false,
    isSaving: false,
  });

  const updateWorkoutName = useCallback((name: string) => {
    setState(prev => ({ ...prev, workoutName: name }));
  }, []);

  const openExerciseModal = useCallback(() => {
    setState(prev => ({ ...prev, isModalOpen: true }));
  }, []);

  const closeExerciseModal = useCallback(() => {
    setState(prev => ({ ...prev, isModalOpen: false }));
  }, []);

  const addExercise = useCallback((exercise: ExerciseListItem) => {
    // Determine if this is a bodyweight exercise - rely on equipment field
    const isBodyweight =
      exercise.equipment?.toLowerCase().includes('bodyweight') ||
      exercise.equipment?.toLowerCase().includes('власна'); // "own" in Ukrainian

    const newExerciseItem: WorkoutExerciseItem = {
      id: `temp-${Date.now()}`, // temporary ID for UI
      exercise,
      sets: [
        {
          type: 'NORMAL',
          targetLoad: isBodyweight ? 0 : 20,
          targetReps: 10,
          order: 1,
        },
      ],
    };

    setState(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExerciseItem],
    }));
  }, []);

  const removeExercise = useCallback((exerciseId: string) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId),
    }));
  }, []);

  const updateExerciseNotes = useCallback((exerciseId: string, notes: string) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, notes } : ex
      ),
    }));
  }, []);

  const addSet = useCallback((exerciseId: string) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: WorkoutSet = {
            type: 'NORMAL',
            targetLoad: lastSet?.targetLoad || 20,
            targetReps: lastSet?.targetReps || 10,
            order: ex.sets.length + 1,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      }),
    }));
  }, []);

  const removeSet = useCallback((exerciseId: string, setOrder: number) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.id === exerciseId) {
          const updatedSets = ex.sets
            .filter(set => set.order !== setOrder)
            .map((set, index) => ({ ...set, order: index + 1 }));
          return { ...ex, sets: updatedSets };
        }
        return ex;
      }),
    }));
  }, []);

  const updateSet = useCallback((
    exerciseId: string,
    setOrder: number,
    field: 'targetLoad' | 'targetReps' | 'type',
    value: number | 'WARMUP' | 'NORMAL'
  ) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(set =>
              set.order === setOrder ? { ...set, [field]: value } : set
            ),
          };
        }
        return ex;
      }),
    }));
  }, []);

  const reorderExercises = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newExercises = [...prev.exercises];
      const [removed] = newExercises.splice(fromIndex, 1);
      newExercises.splice(toIndex, 0, removed);
      return { ...prev, exercises: newExercises };
    });
  }, []);

  const loadWorkoutForEditing = useCallback((workoutData: WorkoutDetails) => {
    const exerciseItems: WorkoutExerciseItem[] = workoutData.items.map(item => ({
      id: `temp-${item.id}`, // Use temp prefix to distinguish from actual DB IDs
      exercise: {
        id: item.exercise.id,
        name: item.exercise.name,
        description: item.exercise.description,
        muscleGroup: item.exercise.muscleGroup?.name || null,
        equipment: item.exercise.equipment?.name || null,
      },
      sets: item.sets.map(set => ({
        type: set.type,
        targetLoad: set.targetLoad,
        targetReps: set.targetReps,
        order: set.order,
      })),
      notes: item.notes || undefined,
    }));

    setState(prev => ({
      ...prev,
      workoutName: workoutData.title,
      exercises: exerciseItems,
    }));
  }, []);

  const saveWorkout = useCallback(async (asDraft: boolean = false, editWorkoutId?: string) => {
    if (!state.workoutName.trim() || state.exercises.length === 0) {
      throw new Error('Workout name and at least one exercise are required');
    }

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      const workoutData = {
        title: state.workoutName.trim(),
        description: null,
        items: state.exercises.map((ex, index) => ({
          exerciseId: ex.exercise.id,
          order: index + 1,
          notes: ex.notes || null,
          sets: ex.sets.map(set => ({
            type: set.type,
            targetLoad: set.targetLoad,
            targetReps: set.targetReps,
            order: set.order,
            notes: null,
          })),
        })),
      };

      let endpoint: string;
      let method: string;

      if (editWorkoutId) {
        // Editing existing workout
        endpoint = `/api/workouts/${editWorkoutId}`;
        method = 'PUT';
        if (asDraft) {
          endpoint += '?status=DRAFT';
        }
      } else {
        // Creating new workout
        endpoint = asDraft ? '/api/workouts/draft' : '/api/workouts';
        method = 'POST';
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData),
      });

      if (!response.ok) {
        throw new Error('Failed to save workout');
      }

      const result = await response.json();

      // Reset state after successful save (only for new workouts)
      if (!editWorkoutId) {
        setState({
          workoutName: '',
          exercises: [],
          isModalOpen: false,
          isSaving: false,
        });
      } else {
        setState(prev => ({ ...prev, isSaving: false }));
      }

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false }));
      throw error;
    }
  }, [state.workoutName, state.exercises]);

  const canSave = state.workoutName.trim() !== '' && state.exercises.length > 0;

  return {
    ...state,
    updateWorkoutName,
    openExerciseModal,
    closeExerciseModal,
    addExercise,
    removeExercise,
    updateExerciseNotes,
    addSet,
    removeSet,
    updateSet,
    reorderExercises,
    saveWorkout,
    loadWorkoutForEditing,
    canSave,
  };
}