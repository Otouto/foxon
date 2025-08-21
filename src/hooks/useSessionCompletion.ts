import { useState, useRef, useCallback } from 'react';
import { SessionCompletionService, type SessionSealData } from '@/services/SessionCompletionService';

export interface CompletedSessionData {
  workoutId: string;
  workoutTitle: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    order: number;
    notes?: string;
    sets: Array<{
      type: string;
      load: number;
      reps: number;
      completed: boolean;
      order: number;
      notes?: string;
    }>;
  }>;
}

interface BackgroundSaveState {
  status: 'idle' | 'saving' | 'completed' | 'error';
  sessionId?: string;
  error?: string;
}

export function useSessionCompletion() {
  const [backgroundSave, setBackgroundSave] = useState<BackgroundSaveState>({ 
    status: 'idle' 
  });
  const backgroundSaveRef = useRef<Promise<string> | null>(null);

  const startBackgroundSave = useCallback(async (sessionData: CompletedSessionData) => {
    setBackgroundSave({ status: 'saving' });

    try {
      const savePromise = SessionCompletionService.saveSession(sessionData);

      // Store the promise for later use
      backgroundSaveRef.current = savePromise;

      const sessionId = await savePromise;
      
      setBackgroundSave({ 
        status: 'completed', 
        sessionId 
      });
      
      return sessionId;
    } catch (error) {
      console.error('Background save failed:', error);
      setBackgroundSave({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to save session' 
      });
      throw error;
    }
  }, []);

  const sealSession = useCallback(async (sealData: SessionSealData) => {
    let sessionId: string;

    // Wait for background save to complete if still in progress
    if (backgroundSave.status === 'saving' && backgroundSaveRef.current) {
      sessionId = await backgroundSaveRef.current;
    } else if (backgroundSave.status === 'completed' && backgroundSave.sessionId) {
      sessionId = backgroundSave.sessionId;
    } else if (backgroundSave.status === 'error') {
      throw new Error(backgroundSave.error || 'Session save failed');
    } else {
      throw new Error('Session not ready for reflection');
    }

    // Save session seal/reflection using service
    await SessionCompletionService.sealSession(sessionId, sealData);

    return sessionId;
  }, [backgroundSave]);

  return {
    backgroundSave,
    startBackgroundSave,
    sealSession,
  };
}
