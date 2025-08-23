'use client';

import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook for managing session timer
 * Following Single Responsibility Principle - only handles timing
 */
export function useSessionTimer() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  /**
   * Start the timer with a callback that receives the duration
   */
  const startTimer = useCallback((onTick: (duration: number) => void, startTime?: Date) => {
    const sessionStartTime = startTime || new Date();
    startTimeRef.current = sessionStartTime;

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Start new timer
    timerRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
      onTick(duration);
    }, 1000);
  }, []);

  /**
   * Stop the timer
   */
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  /**
   * Get current duration without starting timer
   */
  const getCurrentDuration = useCallback((): number => {
    if (!startTimeRef.current) return 0;
    return Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
  }, []);

  /**
   * Get start time
   */
  const getStartTime = useCallback((): Date | null => {
    return startTimeRef.current;
  }, []);

  /**
   * Check if timer is running
   */
  const isTimerRunning = useCallback((): boolean => {
    return timerRef.current !== null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  return {
    startTimer,
    stopTimer,
    getCurrentDuration,
    getStartTime,
    isTimerRunning,
  };
}