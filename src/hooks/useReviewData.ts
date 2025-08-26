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
  sessionGroups: SessionGroup[];
  exercises: ExerciseStatsData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  deleteSession: (sessionId: string) => Promise<boolean>;
}

export function useReviewData(activeTab: 'sessions' | 'exercises', limit: number = 20): UseReviewDataReturn {
  const [sessions, setSessions] = useState<SessionReviewData[]>([]);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [exercises, setExercises] = useState<ExerciseStatsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
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
        const grouped = groupSessionsByTime(processedSessions, weeklyGoal);
        setSessionGroups(grouped);
      } else if (activeTab === 'exercises') {
        setExercises(data.exercises);
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
        const weeklyGoal = 2; // Default fallback, will be properly set on refetch
        const updatedGroups = groupSessionsByTime(updatedSessions, weeklyGoal);
        setSessionGroups(updatedGroups);
        
        // Refetch data to ensure consistency
        fetchData();
      }

      return true;
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      return false;
    }
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
    refetch: fetchData,
    deleteSession
  };
}
