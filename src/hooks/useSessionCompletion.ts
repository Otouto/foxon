import { useState, useRef, useCallback } from 'react';

export interface CompletedSessionData {
  workoutId: string;
  workoutTitle: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalSets: number;
  totalVolume: number;
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

export interface SessionSealData {
  effort: string;
  vibeLine: string;
  note?: string;
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
      const savePromise = fetch('/api/sessions/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionData }),
      }).then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save session: ${response.status} ${errorText}`);
        }
        const result = await response.json();
        return result.sessionId;
      });

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

    // Save session seal/reflection
    const sealResponse = await fetch(`/api/sessions/${sessionId}/seal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sealData),
    });

    if (!sealResponse.ok) {
      const errorText = await sealResponse.text();
      throw new Error(`Failed to save session reflection: ${sealResponse.status} ${errorText}`);
    }

    return sessionId;
  }, [backgroundSave]);

  return {
    backgroundSave,
    startBackgroundSave,
    sealSession,
  };
}
