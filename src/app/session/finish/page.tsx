'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useRef, useMemo } from 'react';
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

interface BackgroundSaveState {
  status: 'idle' | 'saving' | 'completed' | 'error';
  sessionId?: string;
  error?: string;
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

  // Background save state
  const [backgroundSave, setBackgroundSave] = useState<BackgroundSaveState>({ status: 'idle' });
  const backgroundSaveRef = useRef<Promise<string> | null>(null);
  
  // Reflection form state
  const [effort, setEffort] = useState<EffortLevel>(EffortLevel.HARD);
  const [vibeLine, setVibeLine] = useState('');
  const [note, setNote] = useState('');
  const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryEndTime, setSummaryEndTime] = useState<Date | null>(null);
  
  // Session data for summary
  const [completedSession, setCompletedSession] = useState<CompletedSessionData | null>(null);
  
  // Memoize summary data calculation to prevent re-render loops
  const summaryData = useMemo(() => {
    if (!showSummary) return null;
    
    return completedSession || (session && summaryEndTime ? {
      workoutId: session.workoutId,
      workoutTitle: session.workoutTitle,
      startTime: session.startTime,
      endTime: summaryEndTime,
      duration: session.duration,
      totalSets: session.exercises.reduce((total, ex) => total + ex.sets.filter(set => set.completed).length, 0),
      totalVolume: session.exercises.reduce((total, ex) => 
        total + ex.sets.filter(set => set.completed).reduce((sum, set) => sum + (set.actualLoad * set.actualReps), 0), 0
      ),
      exercises: session.exercises
    } : null);
  }, [showSummary, completedSession, session, summaryEndTime]);
  
  // Cleanup localStorage on component unmount to ensure fresh sessions
  useEffect(() => {
    return () => {
      // Only clear if we've successfully shown the summary (meaning session was completed)
      if (showSummary && workoutId) {
        localStorage.removeItem(`workout_session_${workoutId}`);
        console.log('🧹 Cleanup: Cleared localStorage on unmount for workout:', workoutId);
      }
    };
  }, [showSummary, workoutId]);
  
  // Calculate session statistics and start background save when session is available
  useEffect(() => {
    if (session && backgroundSave.status === 'idle') {
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

      const sessionData: CompletedSessionData = {
        workoutId: session.workoutId,
        workoutTitle: session.workoutTitle,
        startTime: session.startTime,
        endTime,
        duration: session.duration,
        totalSets,
        totalVolume,
        exercises: exercisesData,
      };

      setCompletedSession(sessionData);
      
      // Start background save immediately
      startBackgroundSave(sessionData);
    }
  }, [session, backgroundSave.status]);

  // Background save function
  const startBackgroundSave = async (sessionData: CompletedSessionData) => {
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
      
    } catch (error) {
      console.error('Background save failed:', error);
      setBackgroundSave({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to save session' 
      });
    }
  };

  const handleSaveAndComplete = async () => {
    if (!vibeLine.trim()) {
      alert('Please add a vibe line for your session');
      return;
    }

    setIsSubmittingReflection(true);
    
    try {
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
        const errorText = await sealResponse.text();
        throw new Error(`Failed to save session reflection: ${sealResponse.status} ${errorText}`);
      }

      // Set summary data first
      setSummaryEndTime(new Date()); // Set stable end time
      setShowSummary(true);
      
      // Clear session data immediately after setting summary state
      if (workoutId) {
        const storageKey = `workout_session_${workoutId}`;
        const hadData = localStorage.getItem(storageKey) !== null;
        localStorage.removeItem(storageKey);
        console.log('🧹 Cleared localStorage for workout:', workoutId, 'Had data:', hadData);
        
        // Also clear any other session-related data that might exist
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('workout_session_') || key.includes(workoutId)) {
            localStorage.removeItem(key);
            console.log('🧹 Also cleared related key:', key);
          }
        });
      }
      
    } catch (error) {
      console.error('Failed to save reflection:', error);
      alert(error instanceof Error ? error.message : 'Failed to save reflection');
    } finally {
      setIsSubmittingReflection(false);
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

  // Show summary after reflection is submitted (check this FIRST)
  if (showSummary) {
    if (!summaryData) {
      return (
        <div className="px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="text-red-600 mt-2">Session data not available</p>
          <button onClick={() => router.push('/')} className="text-cyan-400 mt-4 block">← Back to home</button>
        </div>
      );
    }
    return (
      <div className="px-6 py-8 pb-32">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/')} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Session Complete</h1>
        </div>

        {/* Session Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{summaryData.workoutTitle} Summary</h2>
          
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatDuration(summaryData.duration)}</p>
              <p className="text-sm text-gray-500">Duration</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{summaryData.totalVolume}kg</p>
              <p className="text-sm text-gray-500">Total Volume</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{summaryData.totalSets}</p>
              <p className="text-sm text-gray-500">Total Sets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-lime-600">{summaryData.exercises.length}</p>
              <p className="text-sm text-gray-500">Exercises</p>
            </div>
          </div>
        </div>

        {/* Navigation button */}
        <div className="fixed bottom-24 left-6 right-6">
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Show loading state only if session is still initializing
  if (isInitializing || !session) {
    return (
      <div className="px-6 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
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

      {/* Background save status indicator */}
      {backgroundSave.status === 'saving' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-700 text-sm">Saving your session in the background...</p>
          </div>
        </div>
      )}

      {backgroundSave.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-red-700 text-sm">
            Error saving session: {backgroundSave.error}. Please try again.
          </p>
        </div>
      )}

      {/* Session Reflection */}
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


      </div>

      {/* Save Button */}
      <div className="fixed bottom-24 left-6 right-6">
        <button 
          onClick={handleSaveAndComplete}
          disabled={isSubmittingReflection || !vibeLine.trim() || backgroundSave.status === 'error'}
          className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmittingReflection ? 'Saving Reflection...' : 'Save & Complete'}
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
