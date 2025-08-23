'use client';

import { useState, useCallback } from 'react';
import { SetType } from '@prisma/client';
import type { WorkoutDetails, WorkoutItem } from '@/lib/types/workout';

/**
 * In-memory representation of a workout set during session
 */
export interface InMemorySet {
  id: string; // Temporary ID for React keys
  type: SetType;
  targetLoad: number;
  targetReps: number;
  actualLoad: number;
  actualReps: number;
  completed: boolean;
  order: number;
  notes?: string;
}

/**
 * In-memory representation of an exercise during session
 */
export interface InMemoryExercise {
  id: string; // WorkoutItem ID
  exerciseId: string; // Actual exercise ID
  exerciseName: string;
  order: number;
  notes?: string;
  sets: InMemorySet[];
  previousSessionData?: { load: number; reps: number }[] | null;
}

/**
 * In-memory session state
 */
export interface InMemorySession {
  workoutId: string;
  workoutTitle: string;
  startTime: Date;
  currentExerciseIndex: number;
  exercises: InMemoryExercise[];
  duration: number; // seconds
}

/**
 * Hook for managing pure session data operations
 * Following Single Responsibility Principle - only handles data transformations
 */
export function useSessionData() {
  const [session, setSession] = useState<InMemorySession | null>(null);

  /**
   * Generate temporary ID for sets
   */
  const generateTempId = useCallback(() => {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  /**
   * Convert workout data to in-memory session format
   */
  const createInMemorySession = useCallback((
    workout: WorkoutDetails, 
    previousData: Map<string, { load: number; reps: number }[]>
  ): InMemorySession => {
    const exercises: InMemoryExercise[] = workout.items.map((item: WorkoutItem) => ({
      id: item.id,
      exerciseId: item.exercise.id,
      exerciseName: item.exercise.name,
      order: item.order,
      notes: item.notes || undefined,
      sets: item.sets.map((set) => ({
        id: generateTempId(),
        type: set.type as SetType,
        targetLoad: set.targetLoad,
        targetReps: set.targetReps,
        actualLoad: set.targetLoad, // Start with target values
        actualReps: set.targetReps,
        completed: false,
        order: set.order,
        notes: set.notes || undefined,
      })),
      previousSessionData: previousData.get(item.exercise.id) || null,
    }));

    return {
      workoutId: workout.id,
      workoutTitle: workout.title,
      startTime: new Date(),
      currentExerciseIndex: 0,
      exercises,
      duration: 0,
    };
  }, [generateTempId]);

  /**
   * Update a set's values
   */
  const updateSet = useCallback((exerciseIndex: number, setIndex: number, updates: Partial<Pick<InMemorySet, 'actualLoad' | 'actualReps' | 'notes'>>) => {
    setSession(prev => {
      if (!prev) return prev;

      const updatedExercises = [...prev.exercises];
      const exercise = updatedExercises[exerciseIndex];
      if (!exercise) return prev;

      const updatedSets = [...exercise.sets];
      const set = updatedSets[setIndex];
      if (!set) return prev;

      updatedSets[setIndex] = { ...set, ...updates };
      updatedExercises[exerciseIndex] = { ...exercise, sets: updatedSets };

      return { ...prev, exercises: updatedExercises };
    });
  }, []);

  /**
   * Toggle set completion
   */
  const toggleSetCompletion = useCallback((exerciseIndex: number, setIndex: number) => {
    setSession(prev => {
      if (!prev) return prev;

      const updatedExercises = [...prev.exercises];
      const exercise = updatedExercises[exerciseIndex];
      if (!exercise) return prev;

      const updatedSets = [...exercise.sets];
      const set = updatedSets[setIndex];
      if (!set) return prev;

      updatedSets[setIndex] = { ...set, completed: !set.completed };
      updatedExercises[exerciseIndex] = { ...exercise, sets: updatedSets };

      return { ...prev, exercises: updatedExercises };
    });
  }, []);

  /**
   * Add a new set to an exercise
   */
  const addSet = useCallback((exerciseIndex: number) => {
    setSession(prev => {
      if (!prev) return prev;

      const updatedExercises = [...prev.exercises];
      const exercise = updatedExercises[exerciseIndex];
      if (!exercise) return prev;

      // Use last set as template, or defaults
      const lastSet = exercise.sets[exercise.sets.length - 1];
      const newSet: InMemorySet = {
        id: generateTempId(),
        type: SetType.NORMAL,
        targetLoad: lastSet?.actualLoad || 0,
        targetReps: lastSet?.actualReps || 0,
        actualLoad: lastSet?.actualLoad || 0,
        actualReps: lastSet?.actualReps || 0,
        completed: false,
        order: exercise.sets.length + 1,
      };

      const updatedSets = [...exercise.sets, newSet];
      updatedExercises[exerciseIndex] = { ...exercise, sets: updatedSets };

      return { ...prev, exercises: updatedExercises };
    });
  }, [generateTempId]);

  /**
   * Navigate to next exercise
   */
  const navigateToNextExercise = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;

      const nextIndex = prev.currentExerciseIndex + 1;
      if (nextIndex >= prev.exercises.length) {
        return prev; // Can't go beyond last exercise
      }

      return { ...prev, currentExerciseIndex: nextIndex };
    });
  }, []);

  /**
   * Navigate to previous exercise
   */
  const navigateToPreviousExercise = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;

      const prevIndex = prev.currentExerciseIndex - 1;
      if (prevIndex < 0) {
        return prev; // Can't go before first exercise
      }

      return { ...prev, currentExerciseIndex: prevIndex };
    });
  }, []);

  /**
   * Get current exercise
   */
  const getCurrentExercise = useCallback((): InMemoryExercise | null => {
    if (!session) return null;
    return session.exercises[session.currentExerciseIndex] || null;
  }, [session]);

  /**
   * Check if workout can be finished (at least one set completed)
   */
  const canFinishWorkout = useCallback((): boolean => {
    if (!session) return false;
    return session.exercises.some(exercise => 
      exercise.sets.some(set => set.completed)
    );
  }, [session]);

  /**
   * Update session duration
   */
  const updateDuration = useCallback((duration: number) => {
    setSession(prev => prev ? { ...prev, duration } : null);
  }, []);

  return {
    session,
    setSession,
    createInMemorySession,
    updateSet,
    toggleSetCompletion,
    addSet,
    navigateToNextExercise,
    navigateToPreviousExercise,
    getCurrentExercise,
    canFinishWorkout,
    updateDuration,
  };
}