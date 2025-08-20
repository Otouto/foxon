'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useInMemorySession } from '@/hooks/useInMemorySession';
import { useWorkoutPreload } from '@/hooks/useWorkoutPreload';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { ActionButtons } from '@/components/workout/ActionButtons';

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
    formatDuration,
    canFinishWorkout,
    initializeSession,
  } = useInMemorySession(workoutId || '', isPreloaded ? preloadedData : null);

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
      <div className="px-6 py-8 flex items-center justify-center min-h-screen">
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
    <div className="px-6 py-8 pb-32">
      <WorkoutHeader 
        workout={workoutForHeader}
        currentExerciseIndex={session.currentExerciseIndex}
        workoutId={workoutId}
        elapsedTime={session.duration}
        formatTime={formatDuration}
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
        onCompleteSet={handleCompleteExercise}
        onAddSet={handleAddSet}
      />

      {/* Finish Button */}
      <div className="fixed bottom-24 left-6 right-6">
        <button 
          onClick={handleFinishWorkout}
          disabled={!canFinishWorkout()}
          className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title={!canFinishWorkout() ? 'Complete at least one set to finish workout' : 'Finish workout'}
        >
          Finish Workout
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

export default function SessionLogPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SessionLogContent />
    </Suspense>
  );
}
