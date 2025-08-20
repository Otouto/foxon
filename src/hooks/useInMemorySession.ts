'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SetType } from '@prisma/client';
import type { WorkoutDetails, WorkoutItem } from '@/lib/types/workout';
import type { PreloadedWorkoutData } from '@/services/WorkoutPreloadService';

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
 * Hook for managing workout sessions entirely in memory
 */
export function useInMemorySession(workoutId: string, preloadedData?: PreloadedWorkoutData | null) {
  const [session, setSession] = useState<InMemorySession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Timer for tracking workout duration
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  /**
   * Generate temporary ID for sets
   */
  const generateTempId = useCallback(() => {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
   * Initialize session from preloaded data or fetch workout data
   */
  const initializeSession = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      let workout: WorkoutDetails;
      let previousData = new Map<string, { load: number; reps: number }[]>();

      if (preloadedData) {
        // Use preloaded data
        workout = preloadedData.workout;
        previousData = preloadedData.previousSessionData;
      } else {
        // Fallback: fetch workout data
        const response = await fetch(`/api/workouts/${workoutId}/preload`);
        if (!response.ok) {
          throw new Error('Failed to load workout data');
        }
        const { preloadedData: fetchedData } = await response.json();
        workout = fetchedData.workout;
        previousData = new Map(Object.entries(fetchedData.previousSessionData));
      }

      const inMemorySession = createInMemorySession(workout, previousData);
      setSession(inMemorySession);
      startTimeRef.current = inMemorySession.startTime;

      // Start duration timer
      timerRef.current = setInterval(() => {
        setSession(prev => prev ? { ...prev, duration: Math.floor((Date.now() - startTimeRef.current!.getTime()) / 1000) } : null);
      }, 1000);

      // Save to localStorage for crash recovery
      localStorage.setItem(`workout_session_${workoutId}`, JSON.stringify(inMemorySession));

    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize session');
    } finally {
      setIsInitializing(false);
    }
  }, [workoutId, preloadedData, createInMemorySession]);

  /**
   * Update a set's values with debouncing
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

      const updatedSession = { ...prev, exercises: updatedExercises };
      
      // Save to localStorage
      localStorage.setItem(`workout_session_${workoutId}`, JSON.stringify(updatedSession));
      
      return updatedSession;
    });
  }, [workoutId]);

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

      const updatedSession = { ...prev, exercises: updatedExercises };
      
      // Save to localStorage
      localStorage.setItem(`workout_session_${workoutId}`, JSON.stringify(updatedSession));
      
      return updatedSession;
    });
  }, [workoutId]);

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

      const updatedSession = { ...prev, exercises: updatedExercises };
      
      // Save to localStorage
      localStorage.setItem(`workout_session_${workoutId}`, JSON.stringify(updatedSession));
      
      return updatedSession;
    });
  }, [workoutId, generateTempId]);

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

      const updatedSession = { ...prev, currentExerciseIndex: nextIndex };
      
      // Save to localStorage
      localStorage.setItem(`workout_session_${workoutId}`, JSON.stringify(updatedSession));
      
      return updatedSession;
    });
  }, [workoutId]);

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

      const updatedSession = { ...prev, currentExerciseIndex: prevIndex };
      
      // Save to localStorage
      localStorage.setItem(`workout_session_${workoutId}`, JSON.stringify(updatedSession));
      
      return updatedSession;
    });
  }, [workoutId]);

  /**
   * Format duration as MM:SS
   */
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
   * Clear session data (for cleanup)
   */
  const clearSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    localStorage.removeItem(`workout_session_${workoutId}`);
    setSession(null);
  }, [workoutId]);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initializeSession]);

  return {
    session,
    isInitializing,
    error,
    getCurrentExercise,
    updateSet,
    toggleSetCompletion,
    addSet,
    navigateToNextExercise,
    navigateToPreviousExercise,
    formatDuration,
    canFinishWorkout,
    clearSession,
    initializeSession, // For retry on error
  };
}
