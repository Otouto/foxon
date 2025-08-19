'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSessionState } from '@/hooks/useSessionState';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { ActionButtons } from '@/components/workout/ActionButtons';

export default function SessionLogPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const { state, actions } = useSessionState(sessionId);
  const { elapsedTime, formatTime } = useWorkoutTimer(sessionId);
  
  // Handle session not found or error
  if (state.error) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Error</h1>
        <p className="text-red-600 mt-2">{state.error}</p>
        <Link href="/workout" className="text-cyan-400 mt-4 block">← Back to workouts</Link>
      </div>
    );
  }
  
  // Show loading state
  if (state.isLoading) {
    return (
      <div className="px-6 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }
  
  if (!state.session || !state.currentExercise) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Session not found</h1>
        <Link href="/workout" className="text-cyan-400 mt-4 block">← Back to workouts</Link>
      </div>
    );
  }

  const toggleSetCompletion = (setIndex: number) => {
    if (!state.currentExercise) return;
    const set = state.currentExercise.sets[setIndex];
    if (set) {
      actions.toggleSetCompletion(set.id);
    }
  };

  const updateSetValue = (setIndex: number, field: 'weight' | 'reps', value: number) => {
    if (!state.currentExercise) return;
    const set = state.currentExercise.sets[setIndex];
    if (set) {
      const apiField = field === 'weight' ? 'load' : 'reps';
      actions.updateSetValue(set.id, apiField, value);
    }
  };

  const addSet = async () => {
    if (!state.currentExercise) return;
    
    const lastSet = state.currentExercise.sets[state.currentExercise.sets.length - 1];
    const defaultLoad = lastSet?.load || 0;
    const defaultReps = lastSet?.reps || 0;
    
    await actions.addSet(state.currentExercise.id, {
      load: defaultLoad,
      reps: defaultReps
    });
  };

  const navigateToNextExercise = async () => {
    if (!state.session) return;
    
    if (state.currentExerciseIndex + 1 < state.session.sessionExercises.length) {
      await actions.navigateToNextExercise();
    } else {
      // Finish workout
      router.push(`/session/${sessionId}/finish`);
    }
  };

  const finishWorkout = () => {
    router.push(`/session/${sessionId}/finish`);
  };

  // Check if this is a bodyweight exercise
  const isBodyweightExercise = state.currentExercise.sets.every(set => set.load === 0);
  
  // Convert session data to format expected by existing components
  const workoutForHeader = {
    name: state.session.workout?.title || 'Unknown Workout',
    exercises: state.session.sessionExercises.length
  };
  
  const exerciseForCard = {
    name: state.currentExercise.exerciseName,
    sets: state.currentExercise.sets.map(set => ({ weight: set.load, reps: set.reps })),
    previousSession: state.currentExercise.sets.map(set => ({ weight: set.load, reps: set.reps }))
  };

  // Convert sets to format expected by ExerciseCard
  const completedSets = state.currentExercise.sets.map(set => set.completed);
  const setValues = state.currentExercise.sets.map(set => ({ weight: set.load, reps: set.reps }));

  return (
    <div className="px-6 py-8 pb-32">
      <WorkoutHeader 
        workout={workoutForHeader}
        currentExerciseIndex={state.currentExerciseIndex}
        workoutId={state.session.workoutId || ''}
        elapsedTime={elapsedTime}
        formatTime={formatTime}
      />

      <ExerciseCard
        currentExercise={exerciseForCard}
        isBodyweightExercise={isBodyweightExercise}
        completedSets={completedSets}
        setValues={setValues}
        toggleSetCompletion={toggleSetCompletion}
        updateSetValue={updateSetValue}
      />

      <ActionButtons
        onCompleteSet={navigateToNextExercise}
        onAddSet={addSet}
      />

      {/* Finish Button */}
      <div className="fixed bottom-24 left-6 right-6">
        <button 
          onClick={finishWorkout}
          className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block cursor-pointer"
        >
          Finish Workout
        </button>
      </div>
    </div>
  );
}
