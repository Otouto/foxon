/**
 * Service for managing session data in browser storage
 * Provides a clean interface for session persistence operations
 */
class SessionStorageService {
  private static readonly TIMER_KEY_PREFIX = 'session_timer_';
  private static readonly DURATION_KEY_PREFIX = 'session_duration_';

  /**
   * Get session timer start time
   */
  getSessionStartTime(sessionId: string): number | null {
    try {
      const key = `${SessionStorageService.TIMER_KEY_PREFIX}${sessionId}`;
      const value = sessionStorage.getItem(key);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.warn('Failed to get session start time:', error);
      return null;
    }
  }

  /**
   * Set session timer start time
   */
  setSessionStartTime(sessionId: string, startTime: number): void {
    try {
      const key = `${SessionStorageService.TIMER_KEY_PREFIX}${sessionId}`;
      sessionStorage.setItem(key, startTime.toString());
    } catch (error) {
      console.warn('Failed to set session start time:', error);
    }
  }

  /**
   * Get session duration
   */
  getSessionDuration(sessionId: string): number | null {
    try {
      const key = `${SessionStorageService.DURATION_KEY_PREFIX}${sessionId}`;
      const value = sessionStorage.getItem(key);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.warn('Failed to get session duration:', error);
      return null;
    }
  }

  /**
   * Set session duration
   */
  setSessionDuration(sessionId: string, duration: number): void {
    try {
      const key = `${SessionStorageService.DURATION_KEY_PREFIX}${sessionId}`;
      sessionStorage.setItem(key, duration.toString());
    } catch (error) {
      console.warn('Failed to set session duration:', error);
    }
  }

  /**
   * Clear all session data for a specific session
   */
  clearSessionData(sessionId: string): void {
    try {
      const timerKey = `${SessionStorageService.TIMER_KEY_PREFIX}${sessionId}`;
      const durationKey = `${SessionStorageService.DURATION_KEY_PREFIX}${sessionId}`;
      sessionStorage.removeItem(timerKey);
      sessionStorage.removeItem(durationKey);
    } catch (error) {
      console.warn('Failed to clear session data:', error);
    }
  }

  // Legacy methods for backward compatibility (can be removed later)
  /**
   * @deprecated Use getSessionStartTime instead
   */
  getWorkoutStartTime(workoutId: string): number | null {
    return this.getSessionStartTime(workoutId);
  }

  /**
   * @deprecated Use setSessionStartTime instead
   */
  setWorkoutStartTime(workoutId: string, startTime: number): void {
    this.setSessionStartTime(workoutId, startTime);
  }

  /**
   * @deprecated Use getSessionDuration instead
   */
  getWorkoutDuration(workoutId: string): number | null {
    return this.getSessionDuration(workoutId);
  }

  /**
   * @deprecated Use setSessionDuration instead
   */
  setWorkoutDuration(workoutId: string, duration: number): void {
    this.setSessionDuration(workoutId, duration);
  }

  /**
   * @deprecated Use clearSessionData instead
   */
  clearWorkoutData(workoutId: string): void {
    this.clearSessionData(workoutId);
  }
}

// Export singleton instance
export const sessionStorageService = new SessionStorageService();
