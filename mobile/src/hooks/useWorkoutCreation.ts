import { useCallback, useState } from 'react';
import type { ExerciseListItem } from '@shared/types/exercise';
import type { WorkoutDetails } from '@shared/types/workout';

import { api } from '@/api/client';

/**
 * Ported from the web app (src/hooks/useWorkoutCreation.ts). Same state machine;
 * fetch swapped for the authenticated API client. Block management is kept in the
 * data model (sessions render blocks) but the mobile create UI doesn't expose it yet —
 * blocks can be managed on web.
 */

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
  blockId?: string;
  blockOrder?: number;
}

interface UseWorkoutCreationState {
  workoutName: string;
  exercises: WorkoutExerciseItem[];
  isSaving: boolean;
}

export function getNextSetDefaults(lastSet?: Pick<WorkoutSet, 'targetLoad' | 'targetReps'>) {
  return {
    targetLoad: lastSet?.targetLoad ?? 20,
    targetReps: lastSet?.targetReps ?? 10,
  };
}

export function useWorkoutCreation() {
  const [state, setState] = useState<UseWorkoutCreationState>({
    workoutName: '',
    exercises: [],
    isSaving: false,
  });

  const updateWorkoutName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, workoutName: name }));
  }, []);

  const addExercise = useCallback((exercise: ExerciseListItem) => {
    const isBodyweight =
      exercise.equipment?.toLowerCase().includes('bodyweight') ||
      exercise.equipment?.toLowerCase().includes('власна'); // "own" in Ukrainian

    const newExerciseItem: WorkoutExerciseItem = {
      id: `temp-${Date.now()}`,
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

    setState((prev) => ({ ...prev, exercises: [...prev.exercises, newExerciseItem] }));
  }, []);

  const removeExercise = useCallback((exerciseId: string) => {
    setState((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.id !== exerciseId),
    }));
  }, []);

  const addSet = useCallback((exerciseId: string) => {
    setState((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1];
          const defaults = getNextSetDefaults(lastSet);
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                type: 'NORMAL' as const,
                targetLoad: defaults.targetLoad,
                targetReps: defaults.targetReps,
                order: ex.sets.length + 1,
              },
            ],
          };
        }
        return ex;
      }),
    }));
  }, []);

  const removeSet = useCallback((exerciseId: string, setOrder: number) => {
    setState((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          const updatedSets = ex.sets
            .filter((set) => set.order !== setOrder)
            .map((set, index) => ({ ...set, order: index + 1 }));
          return { ...ex, sets: updatedSets };
        }
        return ex;
      }),
    }));
  }, []);

  const updateSet = useCallback(
    (
      exerciseId: string,
      setOrder: number,
      updates: Partial<Pick<WorkoutSet, 'targetLoad' | 'targetReps' | 'type'>>
    ) => {
      setState((prev) => ({
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              sets: ex.sets.map((set) =>
                set.order === setOrder ? { ...set, ...updates } : set
              ),
            };
          }
          return ex;
        }),
      }));
    },
    []
  );

  const loadWorkoutForEditing = useCallback((workoutData: WorkoutDetails) => {
    const exerciseItems: WorkoutExerciseItem[] = workoutData.items.map((item) => ({
      id: `temp-${item.id}`,
      exercise: {
        id: item.exercise.id,
        name: item.exercise.name,
        muscleGroup: item.exercise.muscleGroup?.name || null,
        equipment: item.exercise.equipment?.name || null,
        imageUrl: item.exercise.imageUrl || null,
      },
      sets: item.sets.map((set) => ({
        type: set.type,
        targetLoad: set.targetLoad,
        targetReps: set.targetReps,
        order: set.order,
      })),
      notes: item.notes || undefined,
      blockId: item.blockId || undefined,
      blockOrder: item.blockOrder || undefined,
    }));

    setState((prev) => ({
      ...prev,
      workoutName: workoutData.title,
      exercises: exerciseItems,
    }));
  }, []);

  const saveWorkout = useCallback(
    async (asDraft = false, editWorkoutId?: string) => {
      if (!state.workoutName.trim() || state.exercises.length === 0) {
        throw new Error('Workout name and at least one exercise are required');
      }

      setState((prev) => ({ ...prev, isSaving: true }));

      try {
        const workoutData = {
          title: state.workoutName.trim(),
          description: null,
          items: state.exercises.map((ex, index) => ({
            exerciseId: ex.exercise.id,
            order: index + 1,
            notes: ex.notes || null,
            blockId: ex.blockId ?? null,
            blockOrder: ex.blockOrder ?? null,
            sets: ex.sets.map((set) => ({
              type: set.type,
              targetLoad: set.targetLoad,
              targetReps: set.targetReps,
              order: set.order,
              notes: null,
            })),
          })),
        };

        let result;
        if (editWorkoutId) {
          const endpoint = `/api/workouts/${editWorkoutId}${asDraft ? '?status=DRAFT' : ''}`;
          result = await api.put(endpoint, workoutData);
        } else {
          result = await api.post(asDraft ? '/api/workouts/draft' : '/api/workouts', workoutData);
        }

        if (!editWorkoutId) {
          setState({ workoutName: '', exercises: [], isSaving: false });
        } else {
          setState((prev) => ({ ...prev, isSaving: false }));
        }

        return result;
      } catch (error) {
        setState((prev) => ({ ...prev, isSaving: false }));
        throw error;
      }
    },
    [state.workoutName, state.exercises]
  );

  const canSave = state.workoutName.trim() !== '' && state.exercises.length > 0;

  return {
    ...state,
    updateWorkoutName,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    loadWorkoutForEditing,
    saveWorkout,
    canSave,
  };
}
