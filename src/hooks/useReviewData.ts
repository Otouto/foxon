'use client';

import { useState, useEffect } from 'react';
import { groupSessionsByTime, SessionGroup } from '@/lib/utils/dateUtils';

export interface SessionReviewData {
  id: string;
  date: Date;
  workoutTitle: string | null;
  status: string;
  devotionScore?: number | null;
  devotionGrade?: string | null;
  effort?: string;
  vibeLine?: string;
  note?: string;
  duration?: number;
}

export interface ExerciseStatsData {
  exerciseId: string;
  exerciseName: string;
  bestSet: {
    load: number;
    reps: number;
  } | null;
  totalVolume: number;
  sessionCount: number;
}

interface UseReviewDataReturn {
  sessions: SessionReviewData[];
  sessionGroups: SessionGroup<SessionReviewData>[];
  exercises: ExerciseStatsData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  deleteSession: (sessionId: string) => Promise<boolean>;
  clearCache: () => void;
}

interface CacheData {
  sessions: {
    data: SessionReviewData[];
    sessionGroups: SessionGroup<SessionReviewData>[];
    weeklyGoal: number;
    timestamp: number;
  } | null;
  exercises: {
    data: ExerciseStatsData[];
    timestamp: number;
  } | null;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache: CacheData = { sessions: null, exercises: null };

const isCacheFresh = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL;
};

const getCachedData = (tab: 'sessions' | 'exercises') => {
  if (tab === 'sessions' && cache.sessions && isCacheFresh(cache.sessions.timestamp)) {
    return cache.sessions;
  }
  if (tab === 'exercises' && cache.exercises && isCacheFresh(cache.exercises.timestamp)) {
    return cache.exercises;
  }
  return null;
};

export function useReviewData(activeTab: 'sessions' | 'exercises', limit: number = 20): UseReviewDataReturn {
  // Check if we have fresh cached data to avoid initial loading state
  const hasFreshCache = getCachedData(activeTab) !== null;
  
  const [sessions, setSessions] = useState<SessionReviewData[]>([]);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup<SessionReviewData>[]>([]);
  const [exercises, setExercises] = useState<ExerciseStatsData[]>([]);
  const [isLoading, setIsLoading] = useState(!hasFreshCache);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (forceRefresh = false) => {
    try {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedData = getCachedData(activeTab);
        if (cachedData) {
          if (activeTab === 'sessions') {
            const sessionCache = cachedData as CacheData['sessions'];
            setSessions(sessionCache!.data);
            setSessionGroups(sessionCache!.sessionGroups);
          } else {
            const exerciseCache = cachedData as CacheData['exercises'];
            setExercises(exerciseCache!.data);
          }
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/sessions/review?tab=${activeTab}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch review data');
      }

      const data = await response.json();

      if (activeTab === 'sessions') {
        const processedSessions = data.sessions.map((session: SessionReviewData) => ({
          ...session,
          date: new Date(session.date)
        }));
        setSessions(processedSessions);
        
        const weeklyGoal = data.weeklyGoal || 2;
        const grouped = groupSessionsByTime<SessionReviewData>(processedSessions, weeklyGoal);
        setSessionGroups(grouped);

        // Cache the data
        cache.sessions = {
          data: processedSessions,
          sessionGroups: grouped,
          weeklyGoal,
          timestamp: Date.now()
        };
      } else if (activeTab === 'exercises') {
        setExercises(data.exercises);

        // Cache the data
        cache.exercises = {
          data: data.exercises,
          timestamp: Date.now()
        };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/delete`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      // Remove the session from local state immediately for better UX
      const updatedSessions = sessions.filter(session => session.id !== sessionId);
      setSessions(updatedSessions);
      
      // Update session groups if we're on the sessions tab
      if (activeTab === 'sessions') {
        const weeklyGoal = cache.sessions?.weeklyGoal || 2;
        const updatedGroups = groupSessionsByTime<SessionReviewData>(updatedSessions, weeklyGoal);
        setSessionGroups(updatedGroups);
        
        // Update cache to reflect the deletion
        if (cache.sessions) {
          cache.sessions = {
            ...cache.sessions,
            data: updatedSessions,
            sessionGroups: updatedGroups
          };
        }
        
        // Refetch data to ensure consistency with server
        fetchData(true);
      }

      return true;
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      return false;
    }
  };

  const clearCache = () => {
    cache.sessions = null;
    cache.exercises = null;
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    sessions,
    sessionGroups,
    exercises,
    isLoading,
    error,
    refetch: () => fetchData(true),
    deleteSession,
    clearCache
  };
}
