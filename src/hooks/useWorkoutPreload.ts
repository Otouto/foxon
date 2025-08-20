'use client';

import { useState, useCallback } from 'react';
import type { WorkoutListItem } from '@/lib/types/workout';
import type { PreloadedWorkoutData } from '@/services/WorkoutPreloadService';

/**
 * Hook for managing workout data preloading on the client side
 */
export function useWorkoutPreload() {
  const [preloadedWorkouts, setPreloadedWorkouts] = useState<Map<string, PreloadedWorkoutData>>(new Map());
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState<string | null>(null);

  /**
   * Preload workout data for a list of workouts
   */
  const preloadWorkouts = useCallback(async (workouts: WorkoutListItem[]) => {
    if (workouts.length === 0) return;

    setIsPreloading(true);
    setPreloadError(null);

    try {
      // Use functional state update to get current preloaded workouts
      let workoutIdsToLoad: string[] = [];
      
      setPreloadedWorkouts(prev => {
        // Get workout IDs that aren't already preloaded
        workoutIdsToLoad = workouts
          .filter(workout => !prev.has(workout.id))
          .map(workout => workout.id);
        
        return prev; // Don't update state yet
      });

      if (workoutIdsToLoad.length === 0) {
        setIsPreloading(false);
        return; // Nothing to preload
      }

      // Call API to preload workout data
      const response = await fetch('/api/workouts/preload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workoutIds: workoutIdsToLoad }),
      });

      if (!response.ok) {
        throw new Error('Failed to preload workout data');
      }

      const { preloadedData } = await response.json();

      // Update state with preloaded data
      setPreloadedWorkouts(prev => {
        const updated = new Map(prev);
        Object.entries(preloadedData).forEach(([workoutId, data]) => {
          updated.set(workoutId, data as PreloadedWorkoutData);
        });
        return updated;
      });

    } catch (error) {
      console.error('Failed to preload workouts:', error);
      setPreloadError(error instanceof Error ? error.message : 'Failed to preload workouts');
    } finally {
      setIsPreloading(false);
    }
  }, []); // Empty dependency array to prevent re-creation

  /**
   * Get preloaded data for a specific workout
   */
  const getPreloadedWorkout = useCallback((workoutId: string): PreloadedWorkoutData | null => {
    return preloadedWorkouts.get(workoutId) || null;
  }, [preloadedWorkouts]);

  /**
   * Check if a workout is preloaded
   */
  const isWorkoutPreloaded = useCallback((workoutId: string): boolean => {
    return preloadedWorkouts.has(workoutId);
  }, [preloadedWorkouts]);

  /**
   * Preload a single workout
   */
  const preloadSingleWorkout = useCallback(async (workoutId: string) => {
    if (preloadedWorkouts.has(workoutId)) return;

    try {
      const response = await fetch(`/api/workouts/${workoutId}/preload`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to preload workout');
      }

      const { preloadedData } = await response.json();

      setPreloadedWorkouts(prev => {
        const updated = new Map(prev);
        updated.set(workoutId, preloadedData);
        return updated;
      });

    } catch (error) {
      console.error('Failed to preload single workout:', error);
    }
  }, [preloadedWorkouts]);

  /**
   * Clear preloaded data for a workout (useful after workout updates)
   */
  const clearWorkoutPreload = useCallback((workoutId: string) => {
    setPreloadedWorkouts(prev => {
      const updated = new Map(prev);
      updated.delete(workoutId);
      return updated;
    });
  }, []);

  /**
   * Clear all preloaded data
   */
  const clearAllPreloads = useCallback(() => {
    setPreloadedWorkouts(new Map());
  }, []);

  return {
    preloadedWorkouts,
    isPreloading,
    preloadError,
    preloadWorkouts,
    getPreloadedWorkout,
    isWorkoutPreloaded,
    preloadSingleWorkout,
    clearWorkoutPreload,
    clearAllPreloads,
  };
}
