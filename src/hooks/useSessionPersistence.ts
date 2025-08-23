'use client';

import { useCallback, useEffect } from 'react';
import { debouncedStorage } from '@/lib/debouncedStorage';
import type { InMemorySession } from './useSessionData';

/**
 * Hook for managing session persistence to localStorage
 * Following Single Responsibility Principle - only handles persistence
 */
export function useSessionPersistence(workoutId: string) {
  const getStorageKey = useCallback(() => `workout_session_${workoutId}`, [workoutId]);

  /**
   * Save session to localStorage (debounced)
   */
  const saveSession = useCallback((session: InMemorySession) => {
    debouncedStorage.setItem(getStorageKey(), session);
  }, [getStorageKey]);

  /**
   * Save session immediately (for critical operations like navigation)
   */
  const saveSessionImmediate = useCallback((session: InMemorySession) => {
    debouncedStorage.setItem(getStorageKey(), session, 0);
  }, [getStorageKey]);

  /**
   * Load session from localStorage
   */
  const loadSession = useCallback((): InMemorySession | null => {
    return debouncedStorage.getItem(getStorageKey());
  }, [getStorageKey]);

  /**
   * Clear session from localStorage
   */
  const clearSession = useCallback(() => {
    debouncedStorage.removeItem(getStorageKey());
  }, [getStorageKey]);

  /**
   * Check if a session exists in storage
   */
  const hasStoredSession = useCallback((): boolean => {
    return loadSession() !== null;
  }, [loadSession]);

  /**
   * Flush any pending writes immediately
   */
  const flushPendingWrites = useCallback(() => {
    debouncedStorage.flush(getStorageKey());
  }, [getStorageKey]);

  // Cleanup on unmount - flush any pending writes
  useEffect(() => {
    return () => {
      flushPendingWrites();
    };
  }, [flushPendingWrites]);

  return {
    saveSession,
    saveSessionImmediate,
    loadSession,
    clearSession,
    hasStoredSession,
    flushPendingWrites,
  };
}