import { WorkoutService } from './WorkoutService';
import { SessionService } from './SessionService';
import type { WorkoutDetails } from '@/lib/types/workout';

/**
 * Enhanced workout data with pre-loaded session information
 */
export interface PreloadedWorkoutData {
  workout: WorkoutDetails;
  previousSessionData: Map<string, { load: number; reps: number }[]>; // exerciseId -> previous session data
  lastSessionDate: Date | null;
}

/**
 * Service for pre-loading workout data with all necessary information for sessions
 */
export class WorkoutPreloadService {
  private static cache = new Map<string, PreloadedWorkoutData>();
  private static cacheTimestamp = new Map<string, number>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Pre-load workout data with previous session information
   */
  static async preloadWorkoutData(workoutId: string, userId: string): Promise<PreloadedWorkoutData | null> {
    // Check cache first
    const cached = this.getCachedData(workoutId);
    if (cached) {
      return cached;
    }

    try {
      // Workout details and previous-session data are independent: one query each
      const [workout, { previousSessionData, lastSessionDate }] = await Promise.all([
        WorkoutService.getWorkoutById(workoutId),
        SessionService.getPreviousWorkoutSessionData(userId, workoutId)
      ]);
      if (!workout) {
        return null;
      }

      const preloadedData: PreloadedWorkoutData = {
        workout,
        previousSessionData,
        lastSessionDate
      };

      // Cache the data
      this.setCachedData(workoutId, preloadedData);

      return preloadedData;
    } catch (error) {
      console.error('Failed to preload workout data:', error);
      return null;
    }
  }

  /**
   * Pre-load multiple workouts (for workout list page)
   */
  static async preloadMultipleWorkouts(workoutIds: string[], userId: string): Promise<Map<string, PreloadedWorkoutData>> {
    const results = new Map<string, PreloadedWorkoutData>();
    
    // Load workouts in parallel with a reasonable batch size
    const BATCH_SIZE = 3; // Don't overwhelm the database
    
    for (let i = 0; i < workoutIds.length; i += BATCH_SIZE) {
      const batch = workoutIds.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(workoutId => 
        this.preloadWorkoutData(workoutId, userId)
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result) {
          results.set(batch[index], result);
        }
      });
    }

    return results;
  }

  /**
   * Get cached workout data if still valid
   */
  private static getCachedData(workoutId: string): PreloadedWorkoutData | null {
    const cached = this.cache.get(workoutId);
    const timestamp = this.cacheTimestamp.get(workoutId);
    
    if (cached && timestamp && (Date.now() - timestamp) < this.CACHE_DURATION) {
      return cached;
    }
    
    // Clean up expired cache
    this.cache.delete(workoutId);
    this.cacheTimestamp.delete(workoutId);
    return null;
  }

  /**
   * Set cached workout data
   */
  private static setCachedData(workoutId: string, data: PreloadedWorkoutData): void {
    this.cache.set(workoutId, data);
    this.cacheTimestamp.set(workoutId, Date.now());
  }

  /**
   * Clear cache for a specific workout (useful after workout updates)
   */
  static clearWorkoutCache(workoutId: string): void {
    this.cache.delete(workoutId);
    this.cacheTimestamp.delete(workoutId);
  }

  /**
   * Clear all cached data
   */
  static clearAllCache(): void {
    this.cache.clear();
    this.cacheTimestamp.clear();
  }

  /**
   * Get workout data from cache (for instant access during session start)
   */
  static getCachedWorkoutData(workoutId: string): PreloadedWorkoutData | null {
    return this.getCachedData(workoutId);
  }
}
