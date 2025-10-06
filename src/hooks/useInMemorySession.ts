'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SetType } from '@prisma/client';
import type { WorkoutDetails, WorkoutItem } from '@/lib/types/workout';
import type { PreloadedWorkoutData } from '@/services/WorkoutPreloadService';
import { debouncedStorage } from '@/lib/debouncedStorage';
import { SessionStorageManager } from '@/lib/SessionStorageManager';

// Re-export types for compatibility
export interface InMemorySet {
  id: string;
  type: SetType;
  targetLoad: number;
  targetReps: number;
  actualLoad: number;
  actualReps: number;
  completed: boolean;
  order: number;
  notes?: string;
}

export interface InMemoryExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  order: number;
  notes?: string;
  blockId?: string | null;
  blockOrder?: number | null;
  sets: InMemorySet[];
  previousSessionData?: { load: number; reps: number }[] | null;
}

export interface InMemorySession {
  workoutId: string;
  workoutTitle: string;
  startTime: Date;
  currentExerciseIndex: number;
  exercises: InMemoryExercise[];
  duration: number;
}

/**
 * Simplified version of useInMemorySession with better performance and separation of concerns
 * This maintains the same API for compatibility while using optimized internals
 */
export function useInMemorySession(workoutId: string, preloadedData?: PreloadedWorkoutData | null) {
  const [session, setSession] = useState<InMemorySession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Timer management
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Persistence helper
  const getStorageKey = useCallback(() => `workout_session_${workoutId}`, [workoutId]);

  const generateTempId = useCallback(() => {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }, []);

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
      blockId: item.blockId,
      blockOrder: item.blockOrder,
      sets: item.sets.map((set) => ({
        id: generateTempId(),
        type: set.type as SetType,
        targetLoad: set.targetLoad,
        targetReps: set.targetReps,
        actualLoad: set.targetLoad,
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

  // Simplified persistence with debouncing
  const saveSessionToStorage = useCallback((sessionData: InMemorySession, immediate = false) => {
    if (immediate) {
      debouncedStorage.setItem(getStorageKey(), sessionData, 0);
    } else {
      debouncedStorage.setItem(getStorageKey(), sessionData);
    }
  }, [getStorageKey]);

  const initializeSession = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Try to recover existing session
      const savedSession = debouncedStorage.getItem(getStorageKey()) as InMemorySession | null;
      
      if (savedSession && savedSession.workoutId === workoutId) {
        console.log('🔄 Recovered session from localStorage for workout:', workoutId);
        savedSession.startTime = new Date(savedSession.startTime);
        setSession(savedSession);
        startTimeRef.current = savedSession.startTime;

        // Start timer
        timerRef.current = setInterval(() => {
          setSession(prev => prev ? { 
            ...prev, 
            duration: Math.floor((Date.now() - startTimeRef.current!.getTime()) / 1000) 
          } : null);
        }, 1000);

        setIsInitializing(false);
        return;
      }

      // Create new session
      let workout: WorkoutDetails;
      let previousData = new Map<string, { load: number; reps: number }[]>();

      if (preloadedData) {
        workout = preloadedData.workout;
        previousData = preloadedData.previousSessionData;
        console.log('✅ Using preloaded data, skipping API call for workout:', workoutId);
      } else {
        console.log('⚠️  No preloaded data, fetching from API for workout:', workoutId);
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

      // Start timer
      timerRef.current = setInterval(() => {
        setSession(prev => prev ? { 
          ...prev, 
          duration: Math.floor((Date.now() - startTimeRef.current!.getTime()) / 1000) 
        } : null);
      }, 1000);

      // Save to storage
      saveSessionToStorage(inMemorySession);

    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize session');
    } finally {
      setIsInitializing(false);
    }
  }, [workoutId, preloadedData, createInMemorySession, getStorageKey, saveSessionToStorage]);

  // Data manipulation functions with optimized persistence
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
      saveSessionToStorage(updatedSession); // Debounced save
      return updatedSession;
    });
  }, [saveSessionToStorage]);

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
      saveSessionToStorage(updatedSession); // Debounced save
      return updatedSession;
    });
  }, [saveSessionToStorage]);

  const addSet = useCallback((exerciseIndex: number) => {
    setSession(prev => {
      if (!prev) return prev;

      const updatedExercises = [...prev.exercises];
      const exercise = updatedExercises[exerciseIndex];
      if (!exercise) return prev;

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
      saveSessionToStorage(updatedSession); // Debounced save
      return updatedSession;
    });
  }, [generateTempId, saveSessionToStorage]);

  const navigateToNextExercise = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;

      const currentExercise = prev.exercises[prev.currentExerciseIndex];
      let nextIndex = prev.currentExerciseIndex + 1;

      // If current exercise is in a block, skip to the first exercise after the block
      if (currentExercise?.blockId) {
        const currentBlockId = currentExercise.blockId;
        // Find the first exercise that is not in this block
        while (nextIndex < prev.exercises.length && prev.exercises[nextIndex]?.blockId === currentBlockId) {
          nextIndex++;
        }
      }

      if (nextIndex >= prev.exercises.length) return prev;

      const updatedSession = { ...prev, currentExerciseIndex: nextIndex };
      saveSessionToStorage(updatedSession, true); // Immediate save for navigation
      return updatedSession;
    });
  }, [saveSessionToStorage]);

  const navigateToPreviousExercise = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;

      const currentExercise = prev.exercises[prev.currentExerciseIndex];
      let prevIndex = prev.currentExerciseIndex - 1;

      // If current exercise is in a block, go to the first exercise of the block
      if (currentExercise?.blockId) {
        const currentBlockId = currentExercise.blockId;
        // Find the first exercise in this block
        while (prevIndex >= 0 && prev.exercises[prevIndex]?.blockId === currentBlockId) {
          prevIndex--;
        }
      }

      if (prevIndex < 0) return prev;

      // If the previous exercise is in a block, go to the first exercise of that block
      const prevExercise = prev.exercises[prevIndex];
      if (prevExercise?.blockId) {
        const prevBlockId = prevExercise.blockId;
        // Find the first exercise in the previous block
        while (prevIndex > 0 && prev.exercises[prevIndex - 1]?.blockId === prevBlockId) {
          prevIndex--;
        }
      }

      const updatedSession = { ...prev, currentExerciseIndex: prevIndex };
      saveSessionToStorage(updatedSession, true); // Immediate save for navigation
      return updatedSession;
    });
  }, [saveSessionToStorage]);

  const getCurrentExercise = useCallback((): InMemoryExercise | null => {
    if (!session) return null;
    return session.exercises[session.currentExerciseIndex] || null;
  }, [session]);

  // Get all exercises in the current block (if current exercise is in a block)
  const getCurrentBlock = useCallback((): InMemoryExercise[] | null => {
    if (!session) return null;
    const currentExercise = session.exercises[session.currentExerciseIndex];
    if (!currentExercise || !currentExercise.blockId) return null;

    // Find all exercises in the same block and sort by blockOrder
    const blockExercises = session.exercises
      .filter(ex => ex.blockId === currentExercise.blockId)
      .sort((a, b) => (a.blockOrder || 0) - (b.blockOrder || 0));

    return blockExercises;
  }, [session]);

  // Check if current exercise is part of a block
  const isCurrentExerciseInBlock = useCallback((): boolean => {
    if (!session) return false;
    const currentExercise = session.exercises[session.currentExerciseIndex];
    return !!(currentExercise && currentExercise.blockId);
  }, [session]);

  // Check if we're on the last exercise or block
  const isLastExerciseOrBlock = useCallback((): boolean => {
    if (!session) return false;

    const currentExercise = session.exercises[session.currentExerciseIndex];
    if (!currentExercise) return true;

    // If current exercise is in a block, check if there are any exercises after this block
    if (currentExercise.blockId) {
      const currentBlockId = currentExercise.blockId;
      // Find the index after the last exercise in the current block
      let nextIndex = session.currentExerciseIndex + 1;
      while (nextIndex < session.exercises.length && session.exercises[nextIndex]?.blockId === currentBlockId) {
        nextIndex++;
      }
      // If nextIndex is beyond the array, we're on the last block
      return nextIndex >= session.exercises.length;
    }

    // For non-block exercises, simply check if we're on the last exercise
    return session.currentExerciseIndex >= session.exercises.length - 1;
  }, [session]);

  const canFinishWorkout = useCallback((): boolean => {
    if (!session) return false;
    return session.exercises.some(exercise =>
      exercise.sets.some(set => set.completed)
    );
  }, [session]);

  const clearSession = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await SessionStorageManager.clearSession(workoutId);
    setSession(null);
  }, [workoutId]);

  // Initialize on mount and cleanup on unmount
  useEffect(() => {
    initializeSession();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Flush any pending writes
      debouncedStorage.flush(getStorageKey());
    };
  }, [initializeSession, getStorageKey]);

  return {
    session,
    isInitializing,
    error,
    getCurrentExercise,
    getCurrentBlock,
    isCurrentExerciseInBlock,
    isLastExerciseOrBlock,
    updateSet,
    toggleSetCompletion,
    addSet,
    navigateToNextExercise,
    navigateToPreviousExercise,
    canFinishWorkout,
    clearSession,
    initializeSession,
  };
}