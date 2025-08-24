'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useInMemorySession } from '@/hooks/useInMemorySession';
import { useWorkoutPreload } from '@/hooks/useWorkoutPreload';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { ActionButtons } from '@/components/workout/ActionButtons';
import { formatDuration } from '@/lib/utils';

function SessionLogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getPreloadedWorkout } = useWorkoutPreload();
  
  const workoutId = searchParams.get('workoutId');
  const isPreloaded = searchParams.get('preloaded') === 'true';
  
  // Get preloaded data if available
  const preloadedData = workoutId ? getPreloadedWorkout(workoutId) : null;
  
  const {
    session,
    isInitializing,
    error,
    getCurrentExercise,
    updateSet,
    toggleSetCompletion,
    addSet,
    navigateToNextExercise,
    navigateToPreviousExercise,
    canFinishWorkout,
    clearSession,
    initializeSession,
  } = useInMemorySession(workoutId || '', isPreloaded ? preloadedData : null);

  // Confirmation dialog state
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);

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

  // Handle session initialization error
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
        <div className="flex gap-4 mt-4">
          <button 
            onClick={initializeSession}
            className="text-cyan-400 underline"
          >
            Try again
          </button>
          <Link href="/workout" className="text-cyan-400 underline">
            ← Back to workouts
          </Link>
        </div>
      </div>
    );
  }
  
  // Show loading state during initialization
  if (isInitializing || !session) {
    return (
      <div className="session-container items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  const currentExercise = getCurrentExercise();
  
  if (!currentExercise) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Session Complete</h1>
        <p className="text-gray-600 mt-2">No more exercises in this workout</p>
        <Link href="/workout" className="text-cyan-400 mt-4 block">← Back to workouts</Link>
      </div>
    );
  }

  // Handle set completion toggle
  const handleToggleSetCompletion = (setIndex: number) => {
    toggleSetCompletion(session.currentExerciseIndex, setIndex);
  };

  // Handle set value updates
  const handleUpdateSetValue = (setIndex: number, field: 'weight' | 'reps', value: number) => {
    const updateField = field === 'weight' ? 'actualLoad' : 'actualReps';
    updateSet(session.currentExerciseIndex, setIndex, { [updateField]: value });
  };

  // Handle adding new set
  const handleAddSet = () => {
    addSet(session.currentExerciseIndex);
  };

  // Handle navigation to next exercise
  const handleCompleteExercise = () => {
    if (session.currentExerciseIndex + 1 < session.exercises.length) {
      navigateToNextExercise();
    } else {
      // Last exercise - redirect to finish
      router.push(`/session/finish?workoutId=${workoutId}`);
    }
  };

  // Handle finish workout
  const handleFinishWorkout = () => {
    router.push(`/session/finish?workoutId=${workoutId}`);
  };

  // Handle session abandonment
  const handleAbandonSession = async () => {
    try {
      await clearSession();
      router.push(`/workout/${workoutId}`);
    } catch (error) {
      console.error('Failed to abandon session:', error);
      // Still navigate away even if clearing fails
      router.push(`/workout/${workoutId}`);
    }
  };

  // Handle smart back navigation
  const handleBackClick = () => {
    if (!session) return;
    
    if (session.currentExerciseIndex === 0) {
      // First exercise - show abandon confirmation dialog
      setShowAbandonDialog(true);
    } else {
      // Not first exercise - navigate to previous exercise
      navigateToPreviousExercise();
    }
  };

  // Check if this is a bodyweight exercise
  const isBodyweightExercise = currentExercise.sets.every(set => set.targetLoad === 0);
  
  // Convert session data to format expected by existing components
  const workoutForHeader = {
    name: session.workoutTitle,
    exercises: session.exercises.length
  };
  
  const exerciseForCard = {
    name: currentExercise.exerciseName,
    sets: currentExercise.sets.map(set => ({ 
      weight: set.actualLoad, 
      reps: set.actualReps 
    })),
    previousSession: currentExercise.previousSessionData?.map(set => ({ 
      weight: set.load, 
      reps: set.reps 
    })) || null
  };

  // Convert sets to format expected by ExerciseCard
  const completedSets = currentExercise.sets.map(set => set.completed);
  const setValues = currentExercise.sets.map(set => ({ 
    weight: set.actualLoad, 
    reps: set.actualReps 
  }));

  return (
    <div className="session-container">
      <div className="session-content">
        <WorkoutHeader 
          workout={workoutForHeader}
          currentExerciseIndex={session.currentExerciseIndex}
          workoutId={workoutId}
          elapsedTime={session.duration}
          formatTime={formatDuration}
          onBackClick={handleBackClick}
        />

        <ExerciseCard
          currentExercise={exerciseForCard}
          isBodyweightExercise={isBodyweightExercise}
          completedSets={completedSets}
          setValues={setValues}
          toggleSetCompletion={handleToggleSetCompletion}
          updateSetValue={handleUpdateSetValue}
        />

        <ActionButtons
          onAddSet={handleAddSet}
        />
      </div>

      {/* Bottom CTA - Always show either Next Exercise or Finish Workout */}
      <div className="session-finish-button">
        {session.currentExerciseIndex + 1 >= session.exercises.length ? (
          <button 
            onClick={handleFinishWorkout}
            disabled={!canFinishWorkout()}
            className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed touch-target"
            title={!canFinishWorkout() ? 'Complete at least one set to finish workout' : 'Finish workout'}
            aria-label={!canFinishWorkout() ? 'Complete at least one set to finish workout' : 'Finish workout'}
          >
            Finish Workout
          </button>
        ) : (
          <button 
            onClick={handleCompleteExercise}
            className="w-full bg-cyan-400 text-black font-semibold py-4 rounded-2xl text-center block cursor-pointer touch-target"
            aria-label="Complete current exercise and move to next"
          >
            Next Exercise
          </button>
        )}
      </div>

      {/* Abandon Session Confirmation Dialog */}
      {showAbandonDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Abandon Session?
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              You&apos;re on the first exercise. Going back will abandon your current session and clear all progress.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAbandonDialog(false)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={handleAbandonSession}
                className="flex-1 py-3 px-4 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                Abandon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="session-container items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function SessionLogPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SessionLogContent />
    </Suspense>
  );
}
