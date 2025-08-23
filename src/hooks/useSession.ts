'use client';

import { useEffect, useCallback } from 'react';
import type { PreloadedWorkoutData } from '@/services/WorkoutPreloadService';
import { useSessionData } from './useSessionData';
import { useSessionPersistence } from './useSessionPersistence';
import { useSessionTimer } from './useSessionTimer';
import { useSessionInitialization } from './useSessionInitialization';

/**
 * Simplified main session hook that composes focused hooks
 * Following Single Responsibility and Interface Segregation principles
 */
export function useSession(workoutId: string, preloadedData?: PreloadedWorkoutData | null) {
  const sessionData = useSessionData();
  const persistence = useSessionPersistence(workoutId);
  const timer = useSessionTimer();
  const initialization = useSessionInitialization();

  const { 
    session, 
    setSession, 
    createInMemorySession,
    updateSet: updateSetData,
    toggleSetCompletion: toggleSetCompletionData,
    addSet: addSetData,
    navigateToNextExercise: navigateToNextExerciseData,
    navigateToPreviousExercise: navigateToPreviousExerciseData,
    updateDuration,
    getCurrentExercise,
    canFinishWorkout,
  } = sessionData;

  /**
   * Enhanced update set with persistence
   */
  const updateSet = useCallback((exerciseIndex: number, setIndex: number, updates: Parameters<typeof updateSetData>[2]) => {
    updateSetData(exerciseIndex, setIndex, updates);
    // Auto-save after data updates (debounced)
    if (session) {
      persistence.saveSession(session);
    }
  }, [updateSetData, session, persistence]);

  /**
   * Enhanced toggle set completion with persistence
   */
  const toggleSetCompletion = useCallback((exerciseIndex: number, setIndex: number) => {
    toggleSetCompletionData(exerciseIndex, setIndex);
    // Auto-save after data updates (debounced)
    if (session) {
      persistence.saveSession(session);
    }
  }, [toggleSetCompletionData, session, persistence]);

  /**
   * Enhanced add set with persistence
   */
  const addSet = useCallback((exerciseIndex: number) => {
    addSetData(exerciseIndex);
    // Auto-save after data updates (debounced)
    if (session) {
      persistence.saveSession(session);
    }
  }, [addSetData, session, persistence]);

  /**
   * Enhanced navigation with immediate persistence
   */
  const navigateToNextExercise = useCallback(() => {
    navigateToNextExerciseData();
    // Immediately save navigation changes
    if (session) {
      persistence.saveSessionImmediate(session);
    }
  }, [navigateToNextExerciseData, session, persistence]);

  /**
   * Enhanced navigation with immediate persistence
   */
  const navigateToPreviousExercise = useCallback(() => {
    navigateToPreviousExerciseData();
    // Immediately save navigation changes
    if (session) {
      persistence.saveSessionImmediate(session);
    }
  }, [navigateToPreviousExerciseData, session, persistence]);

  /**
   * Initialize session from storage or create new
   */
  const initializeSessionData = useCallback(async () => {
    return initialization.initializeSession(async () => {
      // First, try to recover existing session from localStorage
      const savedSession = persistence.loadSession();
      
      if (savedSession && savedSession.workoutId === workoutId) {
        console.log('🔄 Recovered session from localStorage for workout:', workoutId, savedSession);
        // Convert date strings back to Date objects
        savedSession.startTime = new Date(savedSession.startTime);
        setSession(savedSession);
        
        // Start timer with recovered start time
        timer.startTimer(updateDuration, savedSession.startTime);
        
        return savedSession;
      } else {
        // Clear invalid session data
        if (savedSession) {
          persistence.clearSession();
        }

        // Load workout data and create new session
        const { workout, previousData } = await initialization.loadWorkoutData(workoutId, preloadedData);
        const inMemorySession = createInMemorySession(workout, previousData);
        
        setSession(inMemorySession);
        
        // Start timer
        timer.startTimer(updateDuration, inMemorySession.startTime);
        
        // Save to localStorage
        persistence.saveSession(inMemorySession);
        
        return inMemorySession;
      }
    });
  }, [
    workoutId, 
    preloadedData, 
    persistence, 
    initialization, 
    setSession, 
    createInMemorySession, 
    timer, 
    updateDuration
  ]);

  /**
   * Clear session data and stop timer
   */
  const clearSession = useCallback(() => {
    timer.stopTimer();
    persistence.clearSession();
    setSession(null);
  }, [timer, persistence, setSession]);

  // Initialize session on mount
  useEffect(() => {
    initializeSessionData();
  }, [initializeSessionData]);

  // Auto-save session when it changes (with debouncing)
  useEffect(() => {
    if (session) {
      persistence.saveSession(session);
    }
  }, [session, persistence]);

  return {
    session,
    isInitializing: initialization.isInitializing,
    error: initialization.error,
    getCurrentExercise,
    updateSet,
    toggleSetCompletion,
    addSet,
    navigateToNextExercise,
    navigateToPreviousExercise,
    canFinishWorkout,
    clearSession,
    initializeSession: initializeSessionData, // For retry on error
  };
}