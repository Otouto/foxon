'use client';

import { useState, useCallback } from 'react';
import type { WorkoutDetails } from '@/lib/types/workout';
import type { PreloadedWorkoutData } from '@/services/WorkoutPreloadService';

/**
 * Hook for managing session initialization logic
 * Following Single Responsibility Principle - only handles initialization
 */
export function useSessionInitialization() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load workout data from preloaded data or API
   */
  const loadWorkoutData = useCallback(async (
    workoutId: string, 
    preloadedData?: PreloadedWorkoutData | null
  ): Promise<{ workout: WorkoutDetails; previousData: Map<string, { load: number; reps: number }[]> }> => {
    if (preloadedData) {
      // Use preloaded data - no API call needed!
      console.log('✅ Using preloaded data, skipping API call for workout:', workoutId);
      return {
        workout: preloadedData.workout,
        previousData: preloadedData.previousSessionData
      };
    } else {
      // Fallback: fetch workout data only if we don't have preloaded data
      console.log('⚠️  No preloaded data, fetching from API for workout:', workoutId);
      const response = await fetch(`/api/workouts/${workoutId}/preload`);
      if (!response.ok) {
        throw new Error('Failed to load workout data');
      }
      const { preloadedData: fetchedData } = await response.json();
      return {
        workout: fetchedData.workout,
        previousData: new Map(Object.entries(fetchedData.previousSessionData))
      };
    }
  }, []);

  /**
   * Initialize session with proper error handling
   */
  const initializeSession = useCallback(async <T>(
    initializeFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setIsInitializing(true);
      setError(null);
      
      const result = await initializeFn();
      
      setIsInitializing(false);
      return result;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize session');
      setIsInitializing(false);
      return null;
    }
  }, []);

  return {
    isInitializing,
    error,
    loadWorkoutData,
    initializeSession,
    setError,
  };
}