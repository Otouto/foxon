'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useInMemorySession } from '@/hooks/useInMemorySession';
import { useWorkoutPreload } from '@/hooks/useWorkoutPreload';
import { EffortLevel } from '@prisma/client';

interface SessionSealData {
  effort: EffortLevel;
  vibeLine: string;
  note?: string;
}

interface CompletedSessionData {
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

function SessionFinishContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getPreloadedWorkout } = useWorkoutPreload();
  
  const workoutId = searchParams.get('workoutId');
  const preloadedData = workoutId ? getPreloadedWorkout(workoutId) : null;
  
  const {
    session,
    isInitializing,
    error,
    formatDuration,
    clearSession,
  } = useInMemorySession(workoutId || '', preloadedData);

  const [completedSession, setCompletedSession] = useState<CompletedSessionData | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [effort, setEffort] = useState<EffortLevel>(EffortLevel.HARD);
  const [vibeLine, setVibeLine] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate session statistics when session is available
  useEffect(() => {
    if (session) {
      const endTime = new Date();
      let totalSets = 0;
      let totalVolume = 0;

      const exercisesData = session.exercises.map(exercise => {
        const completedSets = exercise.sets.filter(set => set.completed);
        totalSets += completedSets.length;
        totalVolume += completedSets.reduce((sum, set) => sum + (set.actualLoad * set.actualReps), 0);

        return {
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          order: exercise.order,
          notes: exercise.notes,
          sets: exercise.sets.map(set => ({
            type: set.type,
            load: set.actualLoad,
            reps: set.actualReps,
            completed: set.completed,
            order: set.order,
            notes: set.notes,
          })),
        };
      });

      setCompletedSession({
        workoutId: session.workoutId,
        workoutTitle: session.workoutTitle,
        startTime: session.startTime,
        endTime,
        duration: session.duration,
        totalSets,
        totalVolume,
        exercises: exercisesData,
      });
    }
  }, [session]);

  const handleSaveAndComplete = async () => {
    if (!vibeLine.trim()) {
      alert('Please add a vibe line for your session');
      return;
    }

    if (!completedSession) {
      alert('Session data not available');
      return;
    }

    setIsSubmitting(true);
    setSaveError(null);
    
    try {
      // Save session to database
      const sessionResponse = await fetch('/api/sessions/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionData: completedSession,
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to save session');
      }

      const { sessionId } = await sessionResponse.json();

      // Save session seal
      const sealData: SessionSealData = {
        effort,
        vibeLine: vibeLine.trim(),
        note: note.trim() || undefined
      };

      const sealResponse = await fetch(`/api/sessions/${sessionId}/seal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sealData),
      });

      if (!sealResponse.ok) {
        throw new Error('Failed to save session reflection');
      }

      // Clear in-memory session data
      clearSession();

      // Redirect to home/review
      router.push('/');
      
    } catch (error) {
      console.error('Failed to save session:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save session');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle missing workout ID
  if (!workoutId) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Invalid Session</h1>
        <p className="text-red-600 mt-2">No workout ID provided</p>
        <Link href="/workout" className="text-cyan-400 mt-4 block">← Back to workouts</Link>
      </div>
    );
  }

  // Handle initialization error
  if (error) {
    return (
      <div className="px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/workout" className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <Link href="/workout" className="text-cyan-400 mt-4 block">← Back to workouts</Link>
      </div>
    );
  }

  // Show loading state
  if (isInitializing || !session || !completedSession) {
    return (
      <div className="px-6 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing session summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/session/log?workoutId=${workoutId}&preloaded=false`} className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Session Complete</h1>
      </div>

      {/* Session Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{completedSession.workoutTitle} Summary</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatDuration(completedSession.duration)}</p>
            <p className="text-sm text-gray-500">Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{completedSession.totalVolume}kg</p>
            <p className="text-sm text-gray-500">Total Volume</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{completedSession.totalSets}</p>
            <p className="text-sm text-gray-500">Total Sets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-lime-600">{completedSession.exercises.length}</p>
            <p className="text-sm text-gray-500">Exercises</p>
          </div>
        </div>
      </div>

      {/* Session Seal */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How was your session?</h3>
        
        {/* Effort Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Effort Level
          </label>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Easy</span>
            <div className="flex-1 mx-4">
              <input
                type="range"
                min="1"
                max="4"
                value={Object.values(EffortLevel).indexOf(effort) + 1}
                onChange={(e) => {
                  const effortLevels = [EffortLevel.EASY, EffortLevel.STEADY, EffortLevel.HARD, EffortLevel.ALL_IN];
                  setEffort(effortLevels[parseInt(e.target.value) - 1]);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <span className="text-xs text-gray-500">All-In</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-sm font-medium text-lime-600">{effort}</span>
          </div>
        </div>

        {/* One-line Vibe */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            One-line vibe <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Crushed those bench sets!"
            value={vibeLine}
            onChange={(e) => setVibeLine(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            maxLength={200}
          />
        </div>

        {/* Optional Note */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional notes (optional)
          </label>
          <textarea
            placeholder="Any additional thoughts about this session..."
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent resize-none"
            maxLength={1000}
          />
        </div>

        {/* Save Error */}
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{saveError}</p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-24 left-6 right-6">
        <button 
          onClick={handleSaveAndComplete}
          disabled={isSubmitting || !vibeLine.trim()}
          className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save & Complete'}
        </button>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="px-6 py-8 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function SessionFinishPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SessionFinishContent />
    </Suspense>
  );
}
