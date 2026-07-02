import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { WorkoutDetails, WorkoutItem } from '@shared/types/workout';

import {
  workoutPreloadQueryOptions,
  workoutQueryOptions,
  type WorkoutPreloadData,
} from '@/api/queries';
import { queryClient } from '@/api/queryClient';
import { SessionStorage } from '@/lib/sessionStorage';

/**
 * Ported from the web app (src/hooks/useInMemorySession.ts). Same state machine
 * and public API; differences:
 * - persistence is synchronous MMKV (SessionStorage) instead of debounced localStorage
 * - timer recomputes from startTime on AppState changes (iOS suspends JS timers
 *   in background, but duration is timestamp-derived so it stays correct)
 */

export type SetType = 'WARMUP' | 'NORMAL';

export interface InMemorySet {
  id: string;
  type: SetType;
  targetLoad: number;
  targetReps: number;
  actualLoad: number;
  actualReps: number;
  completed: boolean;
  order: number;
  notes?: string;
}

export interface InMemoryExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  order: number;
  notes?: string;
  blockId?: string | null;
  blockOrder?: number | null;
  equipment?: string | null;
  sets: InMemorySet[];
  previousSessionData?: { load: number; reps: number }[] | null;
}

export interface InMemorySession {
  workoutId: string;
  workoutTitle: string;
  /** ISO string in storage; Date at runtime. */
  startTime: Date;
  currentExerciseIndex: number;
  exercises: InMemoryExercise[];
  duration: number;
}

function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function createInMemorySession(
  workout: WorkoutDetails,
  previousData: Map<string, { load: number; reps: number }[]>
): InMemorySession {
  const exercises: InMemoryExercise[] = workout.items.map((item: WorkoutItem) => ({
    id: item.id,
    exerciseId: item.exercise.id,
    exerciseName: item.exercise.name,
    order: item.order,
    notes: item.notes || undefined,
    blockId: item.blockId,
    blockOrder: item.blockOrder,
    equipment: item.exercise.equipment?.name || null,
    sets: item.sets.map((set) => ({
      id: generateTempId(),
      type: set.type,
      targetLoad: set.targetLoad,
      targetReps: set.targetReps,
      actualLoad: set.targetLoad,
      actualReps: set.targetReps,
      completed: false,
      order: set.order,
      notes: set.notes || undefined,
    })),
    previousSessionData: previousData.get(item.exercise.id) || null,
  }));

  return {
    workoutId: workout.id,
    workoutTitle: workout.title,
    startTime: new Date(),
    currentExerciseIndex: 0,
    exercises,
    duration: 0,
  };
}

export function useInMemorySession(workoutId: string) {
  const [session, setSession] = useState<InMemorySession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const computeDuration = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSession((prev) => (prev ? { ...prev, duration: computeDuration() } : null));
    }, 1000);
  }, [computeDuration]);

  const saveSessionToStorage = useCallback(
    (sessionData: InMemorySession) => {
      SessionStorage.saveSession(workoutId, sessionData);
    },
    [workoutId]
  );

  const startFromPreload = useCallback(
    (preloaded: WorkoutPreloadData) => {
      const previousData = new Map(Object.entries(preloaded.previousSessionData));
      const inMemorySession = createInMemorySession(preloaded.workout, previousData);
      setSession(inMemorySession);
      startTimeRef.current = inMemorySession.startTime;
      startTimer();
      saveSessionToStorage(inMemorySession);
    },
    [saveSessionToStorage, startTimer]
  );

  const initializeSession = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Try to recover an existing session (force-kill / crash recovery)
      const savedSession = SessionStorage.getSession(workoutId);
      if (savedSession && savedSession.workoutId === workoutId) {
        savedSession.startTime = new Date(savedSession.startTime);
        startTimeRef.current = savedSession.startTime;
        savedSession.duration = Math.floor(
          (Date.now() - savedSession.startTime.getTime()) / 1000
        );
        setSession(savedSession);
        startTimer();
        setIsInitializing(false);
        return;
      }

      const preloadOptions = workoutPreloadQueryOptions(workoutId);

      // Fast path: preload already in the cache (warmed on auth / onPressIn).
      // Stale is fine — previous-session values are reference hints.
      const cachedPreload = queryClient.getQueryData(preloadOptions.queryKey);
      if (cachedPreload) {
        startFromPreload(cachedPreload);
        return;
      }

      // Cache miss but the workout itself is cached (list/detail screens warm
      // it): start immediately without previous-session hints and merge them
      // in when the preload lands. The session must not wait on the network.
      const cachedWorkout = queryClient.getQueryData(workoutQueryOptions(workoutId).queryKey);
      if (cachedWorkout) {
        const inMemorySession = createInMemorySession(cachedWorkout, new Map());
        setSession(inMemorySession);
        startTimeRef.current = inMemorySession.startTime;
        startTimer();
        saveSessionToStorage(inMemorySession);

        void queryClient
          .fetchQuery(preloadOptions)
          .then((preloaded) => {
            const previousData = new Map(Object.entries(preloaded.previousSessionData));
            if (previousData.size === 0) return;
            setSession((prev) => {
              if (!prev || prev.workoutId !== workoutId) return prev;
              const exercises = prev.exercises.map((exercise) =>
                exercise.previousSessionData == null
                  ? {
                      ...exercise,
                      previousSessionData: previousData.get(exercise.exerciseId) ?? null,
                    }
                  : exercise
              );
              const updatedSession = { ...prev, exercises };
              saveSessionToStorage(updatedSession);
              return updatedSession;
            });
          })
          .catch(() => {
            // Reference data only — the session works without it.
          });
        return;
      }

      // Cold path (deep link / first run, nothing cached): block on the fetch
      const preloaded = await queryClient.fetchQuery(preloadOptions);
      startFromPreload(preloaded);
    } catch (err) {
      console.error('Failed to initialize session:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize session');
    } finally {
      setIsInitializing(false);
    }
  }, [workoutId, saveSessionToStorage, startTimer, startFromPreload]);

  const updateSet = useCallback(
    (
      exerciseIndex: number,
      setIndex: number,
      updates: Partial<Pick<InMemorySet, 'actualLoad' | 'actualReps' | 'notes'>>
    ) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updatedExercises = [...prev.exercises];
        const exercise = updatedExercises[exerciseIndex];
        if (!exercise) return prev;

        const updatedSets = [...exercise.sets];
        const set = updatedSets[setIndex];
        if (!set) return prev;

        updatedSets[setIndex] = { ...set, ...updates };
        updatedExercises[exerciseIndex] = { ...exercise, sets: updatedSets };

        const updatedSession = { ...prev, exercises: updatedExercises };
        saveSessionToStorage(updatedSession);
        return updatedSession;
      });
    },
    [saveSessionToStorage]
  );

  const toggleSetCompletion = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updatedExercises = [...prev.exercises];
        const exercise = updatedExercises[exerciseIndex];
        if (!exercise) return prev;

        const updatedSets = [...exercise.sets];
        const set = updatedSets[setIndex];
        if (!set) return prev;

        updatedSets[setIndex] = { ...set, completed: !set.completed };
        updatedExercises[exerciseIndex] = { ...exercise, sets: updatedSets };

        const updatedSession = { ...prev, exercises: updatedExercises };
        saveSessionToStorage(updatedSession);
        return updatedSession;
      });
    },
    [saveSessionToStorage]
  );

  const addSet = useCallback(
    (exerciseIndex: number) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updatedExercises = [...prev.exercises];
        const exercise = updatedExercises[exerciseIndex];
        if (!exercise) return prev;

        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet: InMemorySet = {
          id: generateTempId(),
          type: 'NORMAL',
          targetLoad: lastSet?.actualLoad || 0,
          targetReps: lastSet?.actualReps || 0,
          actualLoad: lastSet?.actualLoad || 0,
          actualReps: lastSet?.actualReps || 0,
          completed: false,
          order: exercise.sets.length + 1,
        };

        updatedExercises[exerciseIndex] = { ...exercise, sets: [...exercise.sets, newSet] };
        const updatedSession = { ...prev, exercises: updatedExercises };
        saveSessionToStorage(updatedSession);
        return updatedSession;
      });
    },
    [saveSessionToStorage]
  );

  const navigateToNextExercise = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const currentExercise = prev.exercises[prev.currentExerciseIndex];
      let nextIndex = prev.currentExerciseIndex + 1;

      if (currentExercise?.blockId) {
        const currentBlockId = currentExercise.blockId;
        while (
          nextIndex < prev.exercises.length &&
          prev.exercises[nextIndex]?.blockId === currentBlockId
        ) {
          nextIndex++;
        }
      }

      if (nextIndex >= prev.exercises.length) return prev;

      const updatedSession = { ...prev, currentExerciseIndex: nextIndex };
      saveSessionToStorage(updatedSession);
      return updatedSession;
    });
  }, [saveSessionToStorage]);

  const navigateToPreviousExercise = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const currentExercise = prev.exercises[prev.currentExerciseIndex];
      let prevIndex = prev.currentExerciseIndex - 1;

      if (currentExercise?.blockId) {
        const currentBlockId = currentExercise.blockId;
        while (prevIndex >= 0 && prev.exercises[prevIndex]?.blockId === currentBlockId) {
          prevIndex--;
        }
      }

      if (prevIndex < 0) return prev;

      const prevExercise = prev.exercises[prevIndex];
      if (prevExercise?.blockId) {
        const prevBlockId = prevExercise.blockId;
        while (prevIndex > 0 && prev.exercises[prevIndex - 1]?.blockId === prevBlockId) {
          prevIndex--;
        }
      }

      const updatedSession = { ...prev, currentExerciseIndex: prevIndex };
      saveSessionToStorage(updatedSession);
      return updatedSession;
    });
  }, [saveSessionToStorage]);

  const getCurrentExercise = useCallback((): InMemoryExercise | null => {
    if (!session) return null;
    return session.exercises[session.currentExerciseIndex] || null;
  }, [session]);

  const getCurrentBlock = useCallback((): InMemoryExercise[] | null => {
    if (!session) return null;
    const currentExercise = session.exercises[session.currentExerciseIndex];
    if (!currentExercise || !currentExercise.blockId) return null;

    return session.exercises
      .filter((ex) => ex.blockId === currentExercise.blockId)
      .sort((a, b) => (a.blockOrder || 0) - (b.blockOrder || 0));
  }, [session]);

  const isCurrentExerciseInBlock = useCallback((): boolean => {
    if (!session) return false;
    const currentExercise = session.exercises[session.currentExerciseIndex];
    return !!currentExercise?.blockId;
  }, [session]);

  const isLastExerciseOrBlock = useCallback((): boolean => {
    if (!session) return false;
    const currentExercise = session.exercises[session.currentExerciseIndex];
    if (!currentExercise) return true;

    if (currentExercise.blockId) {
      const currentBlockId = currentExercise.blockId;
      let nextIndex = session.currentExerciseIndex + 1;
      while (
        nextIndex < session.exercises.length &&
        session.exercises[nextIndex]?.blockId === currentBlockId
      ) {
        nextIndex++;
      }
      return nextIndex >= session.exercises.length;
    }

    return session.currentExerciseIndex >= session.exercises.length - 1;
  }, [session]);

  const canFinishWorkout = useCallback((): boolean => {
    if (!session) return false;
    return session.exercises.some((exercise) => exercise.sets.some((set) => set.completed));
  }, [session]);

  const clearSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    SessionStorage.clearSession(workoutId);
    setSession(null);
  }, [workoutId]);

  // Initialize on mount, clean up timer on unmount
  useEffect(() => {
    initializeSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initializeSession]);

  // iOS suspends JS while backgrounded; resync the displayed duration on return
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && startTimeRef.current) {
        setSession((prev) => (prev ? { ...prev, duration: computeDuration() } : null));
      }
    });
    return () => subscription.remove();
  }, [computeDuration]);

  return {
    session,
    isInitializing,
    error,
    getCurrentExercise,
    getCurrentBlock,
    isCurrentExerciseInBlock,
    isLastExerciseOrBlock,
    updateSet,
    toggleSetCompletion,
    addSet,
    navigateToNextExercise,
    navigateToPreviousExercise,
    canFinishWorkout,
    clearSession,
    initializeSession,
  };
}
