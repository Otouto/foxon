'use client';

import { useState, useEffect } from 'react';

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
  exercises: ExerciseStatsData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  deleteSession: (sessionId: string) => Promise<boolean>;
}

export function useReviewData(activeTab: 'sessions' | 'exercises', limit: number = 20): UseReviewDataReturn {
  const [sessions, setSessions] = useState<SessionReviewData[]>([]);
  const [exercises, setExercises] = useState<ExerciseStatsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/sessions/review?tab=${activeTab}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch review data');
      }

      const data = await response.json();

      if (activeTab === 'sessions') {
        setSessions(data.sessions.map((session: SessionReviewData) => ({
          ...session,
          date: new Date(session.date)
        })));
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
      setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
      
      // Refetch data to ensure consistency
      if (activeTab === 'sessions') {
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
    exercises,
    isLoading,
    error,
    refetch: fetchData,
    deleteSession
  };
}
