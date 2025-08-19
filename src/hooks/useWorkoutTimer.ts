import { useState, useEffect } from 'react';
import { sessionStorageService } from '@/services/SessionStorageService';

interface UseWorkoutTimerReturn {
  startTime: number | null;
  elapsedTime: number;
  formatTime: (seconds: number) => string;
}

export function useWorkoutTimer(sessionId: string | null): UseWorkoutTimerReturn {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Initialize timer when component mounts or retrieve from session storage
  useEffect(() => {
    if (!sessionId) return;
    
    const savedStartTime = sessionStorageService.getSessionStartTime(sessionId);
    
    if (savedStartTime) {
      setStartTime(savedStartTime);
    } else {
      const now = Date.now();
      setStartTime(now);
      sessionStorageService.setSessionStartTime(sessionId, now);
    }
  }, [sessionId]);

  // Update current time every second
  useEffect(() => {
    if (!startTime) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);

  // Calculate elapsed time - ensure it's never negative and starts at 0
  const elapsedTime = startTime ? Math.max(0, Math.floor((currentTime - startTime) / 1000)) : 0;

  // Format time as MM:SS - ensure never negative
  const formatTime = (seconds: number): string => {
    const safeSeconds = Math.max(0, seconds);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    startTime,
    elapsedTime,
    formatTime
  };
}
