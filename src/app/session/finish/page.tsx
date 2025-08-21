'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useMemo, useCallback } from 'react';
import { useInMemorySession } from '@/hooks/useInMemorySession';
import { useWorkoutPreload } from '@/hooks/useWorkoutPreload';
import { useSessionCompletion, type CompletedSessionData } from '@/hooks/useSessionCompletion';
import type { ReflectionFormData } from '@/hooks/useSessionReflection';
import type { SessionSealData } from '@/services/SessionCompletionService';
import { 
  SessionReflectionForm, 
  BackgroundSaveIndicator, 
  SessionErrorBoundary, 
  Summary 
} from '@/components/session';

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
  } = useInMemorySession(workoutId || '', preloadedData);

  // Session completion hook
  const { backgroundSave, startBackgroundSave, sealSession } = useSessionCompletion();
  
  // Handle reflection form submission
  const handleReflectionSubmit = useCallback(async (formData: ReflectionFormData) => {
    const sealData: SessionSealData = {
      effort: formData.effort.toString(),
      vibeLine: formData.vibeLine,
      note: formData.note
    };

    await sealSession(sealData);

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
  }, [sealSession, workoutId]);


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
  
  // Prepare session data and start background save when session is available
  useEffect(() => {
    if (session && backgroundSave.status === 'idle') {
      const endTime = new Date();

      const exercisesData = session.exercises.map(exercise => ({
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
      }));

      const sessionData: CompletedSessionData = {
        workoutId: session.workoutId,
        workoutTitle: session.workoutTitle,
        startTime: session.startTime,
        endTime,
        duration: session.duration,
        exercises: exercisesData,
      };

      setCompletedSession(sessionData);
      
      // Start background save immediately
      startBackgroundSave(sessionData);
    }
  }, [session, backgroundSave.status, startBackgroundSave]);





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
        <div className="mb-6">
          <Summary data={summaryData} />
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
      <BackgroundSaveIndicator saveState={backgroundSave} className="mb-6" />

      {/* Session Reflection Form */}
      <SessionReflectionForm 
        onSubmit={handleReflectionSubmit}
        disabled={backgroundSave.status === 'error'}
        className="mb-32"
      />

      {/* Fixed button is now handled inside the form component */}
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
    <SessionErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <SessionFinishContent />
      </Suspense>
    </SessionErrorBoundary>
  );
}
