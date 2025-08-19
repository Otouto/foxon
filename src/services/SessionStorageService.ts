/**
 * Service for managing workout session data in browser storage
 * Provides a clean interface for session persistence operations
 */
class SessionStorageService {
  private static readonly TIMER_KEY_PREFIX = 'workout_timer_';
  private static readonly DURATION_KEY_PREFIX = 'workout_duration_';

  /**
   * Get workout timer start time
   */
  getWorkoutStartTime(workoutId: string): number | null {
    try {
      const key = `${SessionStorageService.TIMER_KEY_PREFIX}${workoutId}`;
      const value = sessionStorage.getItem(key);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.warn('Failed to get workout start time:', error);
      return null;
    }
  }

  /**
   * Set workout timer start time
   */
  setWorkoutStartTime(workoutId: string, startTime: number): void {
    try {
      const key = `${SessionStorageService.TIMER_KEY_PREFIX}${workoutId}`;
      sessionStorage.setItem(key, startTime.toString());
    } catch (error) {
      console.warn('Failed to set workout start time:', error);
    }
  }

  /**
   * Get workout duration
   */
  getWorkoutDuration(workoutId: string): number | null {
    try {
      const key = `${SessionStorageService.DURATION_KEY_PREFIX}${workoutId}`;
      const value = sessionStorage.getItem(key);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.warn('Failed to get workout duration:', error);
      return null;
    }
  }

  /**
   * Set workout duration
   */
  setWorkoutDuration(workoutId: string, duration: number): void {
    try {
      const key = `${SessionStorageService.DURATION_KEY_PREFIX}${workoutId}`;
      sessionStorage.setItem(key, duration.toString());
    } catch (error) {
      console.warn('Failed to set workout duration:', error);
    }
  }

  /**
   * Clear all workout data for a specific workout
   */
  clearWorkoutData(workoutId: string): void {
    try {
      const timerKey = `${SessionStorageService.TIMER_KEY_PREFIX}${workoutId}`;
      const durationKey = `${SessionStorageService.DURATION_KEY_PREFIX}${workoutId}`;
      sessionStorage.removeItem(timerKey);
      sessionStorage.removeItem(durationKey);
    } catch (error) {
      console.warn('Failed to clear workout data:', error);
    }
  }
}

// Export singleton instance
export const sessionStorageService = new SessionStorageService();
