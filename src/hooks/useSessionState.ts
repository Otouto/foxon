import { useState, useEffect, useCallback, useRef } from 'react';
import { getSessionFromAPI, batchUpdateSets, finishSession, getPreviousSessionData } from '@/lib/sessionClient';
import type { SessionWithDetails, BatchSetOperation } from '@/services/SessionService';
import { SetType } from '@prisma/client';

interface SetData {
  id: string;
  type: SetType;
  load: number;
  reps: number;
  completed: boolean;
  order: number;
  notes?: string;
}

interface ExerciseData {
  id: string;
  exerciseId: string;
  exerciseName: string;
  order: number;
  notes?: string;
  sets: SetData[];
  previousSessionData?: { load: number; reps: number }[] | null;
}

interface SessionState {
  session: SessionWithDetails | null;
  currentExerciseIndex: number;
  currentExercise: ExerciseData | null;
  isLoading: boolean;
  error: string | null;
}

interface SessionActions {
  toggleSetCompletion: (setId: string) => Promise<void>;
  updateSetValue: (setId: string, field: 'load' | 'reps', value: number) => Promise<void>;
  addSet: (exerciseId: string, setData: { load: number; reps: number; type?: SetType }) => Promise<void>;
  navigateToNextExercise: () => Promise<void>;
  finishWorkout: () => Promise<SessionWithDetails | null>;
  refresh: () => Promise<void>;
}

export interface UseSessionStateReturn {
  state: SessionState;
  actions: SessionActions;
}

export function useSessionState(sessionId: string): UseSessionStateReturn {
  const [state, setState] = useState<SessionState>({
    session: null,
    currentExerciseIndex: 0,
    currentExercise: null,
    isLoading: true,
    error: null,
  });

  // Use ref to batch operations and avoid excessive API calls
  const pendingOperations = useRef<BatchSetOperation[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track optimistic updates to prevent server data from overriding them
  const optimisticUpdates = useRef<Map<string, { field: string; timestamp: number }>>(new Map());

  // Helper to convert database session to local format
  const convertSessionToLocal = useCallback((session: SessionWithDetails): ExerciseData[] => {
    return session.sessionExercises.map(exercise => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exercise.name,
      order: exercise.order,
      notes: exercise.notes || undefined,
      sets: exercise.sessionSets.map(set => ({
        id: set.id,
        type: set.type,
        load: Number(set.load),
        reps: set.reps,
        completed: set.completed,
        order: set.order,
        notes: set.notes || undefined,
      })),
      previousSessionData: null // Will be loaded separately
    }));
  }, []);

  // Helper to load previous session data for an exercise
  const loadPreviousSessionData = useCallback(async (exerciseId: string): Promise<{ load: number; reps: number }[] | null> => {
    try {
      return await getPreviousSessionData(sessionId, exerciseId);
    } catch (error) {
      console.error('Failed to load previous session data:', error);
      return null;
    }
  }, [sessionId]);

  // Load session data
  const loadSession = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const sessionData = await getSessionFromAPI(sessionId);
      if (!sessionData) {
        setState(prev => ({ ...prev, error: 'Session not found', isLoading: false }));
        return;
      }

      const exercises = convertSessionToLocal(sessionData);
      
      // Load previous session data for the first exercise
      if (exercises.length > 0) {
        const firstExercise = exercises[0];
        const previousData = await loadPreviousSessionData(firstExercise.exerciseId);
        firstExercise.previousSessionData = previousData;
      }

      const currentExercise = exercises[0] || null;

      setState({
        session: sessionData,
        currentExerciseIndex: 0,
        currentExercise,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to load session:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load session', 
        isLoading: false 
      }));
    }
  }, [sessionId, convertSessionToLocal, loadPreviousSessionData]);

  // Batch operation executor
  const executeBatchOperations = useCallback(async () => {
    if (pendingOperations.current.length === 0) return;

    try {
      const operations = [...pendingOperations.current];
      pendingOperations.current = [];

      const updatedSession = await batchUpdateSets(sessionId, operations);
      if (updatedSession) {
        // Use a timeout to check if there are still pending operations after the API call
        setTimeout(() => {
          setState(prev => {
            // Only update if there are no new pending operations
            if (pendingOperations.current.length === 0) {
              const exercises = convertSessionToLocal(updatedSession);
              return {
                ...prev,
                session: updatedSession,
                currentExercise: exercises[prev.currentExerciseIndex] || null,
              };
            } else {
              // Just update session data, keep optimistic current exercise
              return {
                ...prev,
                session: updatedSession,
              };
            }
          });
        }, 10); // Small delay to allow any new operations to be queued
        
        // Clear old optimistic updates that have been processed
        const now = Date.now();
        optimisticUpdates.current.forEach((update, key) => {
          if (now - update.timestamp > 500) { // Clear updates older than 500ms
            optimisticUpdates.current.delete(key);
          }
        });
      }
    } catch (error) {
      console.error('Failed to execute batch operations:', error);
      setState(prev => ({ ...prev, error: 'Failed to update session' }));
      // Clear optimistic updates on error
      optimisticUpdates.current.clear();
    }
  }, [sessionId, convertSessionToLocal]);

  // Queue batch operation
  const queueOperation = useCallback((operation: BatchSetOperation) => {
    pendingOperations.current.push(operation);

    // Clear existing timeout and set new one
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Execute batch operations after a shorter delay to reduce flicker
    batchTimeoutRef.current = setTimeout(executeBatchOperations, 100);
  }, [executeBatchOperations]);

  // Actions
  const toggleSetCompletion = useCallback(async (setId: string) => {
    if (!state.session || !state.currentExercise) return;

    // Track this optimistic update
    optimisticUpdates.current.set(`${setId}-completed`, {
      field: 'completed',
      timestamp: Date.now()
    });

    // Optimistic update
    setState(prev => {
      if (!prev.currentExercise) return prev;
      
      const updatedSets = prev.currentExercise.sets.map(set =>
        set.id === setId ? { ...set, completed: !set.completed } : set
      );
      
      return {
        ...prev,
        currentExercise: {
          ...prev.currentExercise,
          sets: updatedSets
        }
      };
    });

    // Queue the operation
    const set = state.currentExercise.sets.find(s => s.id === setId);
    if (set) {
      queueOperation({
        setId,
        operation: 'update',
        data: { completed: !set.completed }
      });
    }
  }, [state.session, state.currentExercise, queueOperation]);

  const updateSetValue = useCallback(async (setId: string, field: 'load' | 'reps', value: number) => {
    if (!state.session || !state.currentExercise) return;

    // Track this optimistic update
    optimisticUpdates.current.set(`${setId}-${field}`, {
      field,
      timestamp: Date.now()
    });

    // Optimistic update
    setState(prev => {
      if (!prev.currentExercise) return prev;
      
      const updatedSets = prev.currentExercise.sets.map(set =>
        set.id === setId ? { ...set, [field]: value } : set
      );
      
      return {
        ...prev,
        currentExercise: {
          ...prev.currentExercise,
          sets: updatedSets
        }
      };
    });

    // Queue the operation
    queueOperation({
      setId,
      operation: 'update',
      data: { [field]: value }
    });
  }, [state.session, state.currentExercise, queueOperation]);

  const addSet = useCallback(async (exerciseId: string, setData: { load: number; reps: number; type?: SetType }) => {
    if (!state.session || !state.currentExercise) return;

    const sessionExercise = state.session.sessionExercises.find(ex => ex.id === exerciseId);
    if (!sessionExercise) return;

    const newOrder = Math.max(...state.currentExercise.sets.map(s => s.order), 0) + 1;

    // Queue the operation
    queueOperation({
      operation: 'create',
      sessionExerciseId: exerciseId,
      data: {
        type: setData.type || SetType.NORMAL,
        load: setData.load,
        reps: setData.reps,
        completed: false,
        order: newOrder,
      }
    });

    // Execute immediately for adding sets to get the new set ID
    await executeBatchOperations();
  }, [state.session, state.currentExercise, queueOperation, executeBatchOperations]);

  const navigateToNextExercise = useCallback(async () => {
    if (!state.session) return;

    // Execute any pending operations first
    await executeBatchOperations();

    const nextIndex = state.currentExerciseIndex + 1;
    if (nextIndex < state.session.sessionExercises.length) {
      const exercises = convertSessionToLocal(state.session);
      
      // Load previous session data for the next exercise
      if (exercises[nextIndex]) {
        const nextExercise = exercises[nextIndex];
        const previousData = await loadPreviousSessionData(nextExercise.exerciseId);
        nextExercise.previousSessionData = previousData;
      }
      
      setState(prev => ({
        ...prev,
        currentExerciseIndex: nextIndex,
        currentExercise: exercises[nextIndex] || null,
      }));
    }
  }, [state.session, state.currentExerciseIndex, executeBatchOperations, convertSessionToLocal, loadPreviousSessionData]);

  const finishWorkout = useCallback(async (): Promise<SessionWithDetails | null> => {
    if (!state.session) return null;

    try {
      // Execute any pending operations first
      await executeBatchOperations();

      // Finish the session
      const finishedSession = await finishSession(sessionId);
      if (finishedSession) {
        setState(prev => ({ ...prev, session: finishedSession }));
      }
      return finishedSession;
    } catch (error) {
      console.error('Failed to finish workout:', error);
      setState(prev => ({ ...prev, error: 'Failed to finish workout' }));
      return null;
    }
  }, [state.session, sessionId, executeBatchOperations]);

  const refresh = useCallback(async () => {
    await loadSession();
  }, [loadSession]);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    actions: {
      toggleSetCompletion,
      updateSetValue,
      addSet,
      navigateToNextExercise,
      finishWorkout,
      refresh,
    },
  };
}
