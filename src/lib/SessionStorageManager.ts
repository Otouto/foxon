'use client';

import { debouncedStorage } from './debouncedStorage';

/**
 * Centralized session storage management to prevent race conditions and ensure consistent cleanup
 * Following the same Service Layer pattern as WorkoutService, SessionService, etc.
 */
export class SessionStorageManager {
  private static cleanupInProgress = new Set<string>();
  private static readonly STORAGE_KEY_PREFIX = 'workout_session_';

  /**
   * Get the storage key for a workout session
   */
  private static getStorageKey(workoutId: string): string {
    return `${this.STORAGE_KEY_PREFIX}${workoutId}`;
  }

  /**
   * Clear a session from storage with race condition protection
   * Prevents multiple cleanup operations on the same session
   */
  static async clearSession(workoutId: string): Promise<void> {
    const key = this.getStorageKey(workoutId);
    
    // Prevent concurrent cleanup operations
    if (this.cleanupInProgress.has(workoutId)) {
      console.log('🔄 Cleanup already in progress for workout:', workoutId);
      return;
    }

    this.cleanupInProgress.add(workoutId);

    try {
      // Check if data exists before attempting removal
      const hadData = debouncedStorage.getItem(key) !== null;
      
      if (hadData) {
        // Cancel any pending writes first
        debouncedStorage.cancel(key);
        
        // Remove from storage
        debouncedStorage.removeItem(key);
        
        console.log('🧹 Cleared session storage for workout:', workoutId);
      } else {
        console.log('🔍 No session data found for workout:', workoutId);
      }

    } catch (error) {
      console.warn('Failed to clear session storage for workout:', workoutId, error);
    } finally {
      // Always remove from cleanup tracking
      this.cleanupInProgress.delete(workoutId);
    }
  }

  /**
   * Clear multiple sessions (for batch cleanup operations)
   */
  static async clearMultipleSessions(workoutIds: string[]): Promise<void> {
    const clearPromises = workoutIds.map(id => this.clearSession(id));
    await Promise.all(clearPromises);
  }

  /**
   * Clean up any related session storage keys (defensive cleanup)
   * Scans for abandoned or orphaned session data
   */
  static cleanupRelatedStorage(workoutId: string): void {
    try {
      const keysToRemove: string[] = [];
      
      // Scan localStorage for related keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.STORAGE_KEY_PREFIX) && key.includes(workoutId)) {
          keysToRemove.push(key);
        }
      });

      // Remove related keys
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log('🧹 Cleaned up related storage key:', key);
        } catch (error) {
          console.warn('Failed to clean up storage key:', key, error);
        }
      });

    } catch (error) {
      console.warn('Failed to perform defensive cleanup for workout:', workoutId, error);
    }
  }

  /**
   * Check if a session exists in storage
   */
  static hasSession(workoutId: string): boolean {
    try {
      const key = this.getStorageKey(workoutId);
      return debouncedStorage.getItem(key) !== null;
    } catch (error) {
      console.warn('Failed to check session existence for workout:', workoutId, error);
      return false;
    }
  }

  /**
   * Get all active session workout IDs (for debugging/monitoring)
   */
  static getActiveSessionIds(): string[] {
    try {
      const sessionIds: string[] = [];
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.STORAGE_KEY_PREFIX)) {
          const workoutId = key.replace(this.STORAGE_KEY_PREFIX, '');
          sessionIds.push(workoutId);
        }
      });

      return sessionIds;
    } catch (error) {
      console.warn('Failed to get active session IDs:', error);
      return [];
    }
  }

  /**
   * Cleanup abandoned sessions (older than maxAge)
   */
  static cleanupAbandonedSessions(maxAgeHours: number = 24): void {
    try {
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds
      const keysToRemove: string[] = [];

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.STORAGE_KEY_PREFIX)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const data = JSON.parse(item);
              const startTime = new Date(data.startTime);
              const age = Date.now() - startTime.getTime();
              
              if (age > maxAge) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // If we can't parse the data, it's corrupted - remove it
            keysToRemove.push(key);
          }
        }
      });

      // Remove abandoned/corrupted sessions
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log('🧹 Removed abandoned session:', key);
        } catch (error) {
          console.warn('Failed to remove abandoned session:', key, error);
        }
      });

      if (keysToRemove.length > 0) {
        console.log(`🧹 Cleaned up ${keysToRemove.length} abandoned sessions`);
      }

    } catch (error) {
      console.warn('Failed to cleanup abandoned sessions:', error);
    }
  }
}