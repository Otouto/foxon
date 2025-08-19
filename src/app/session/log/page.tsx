'use client';

import Link from 'next/link';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { useSetTracking } from '@/hooks/useSetTracking';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { ActionButtons } from '@/components/workout/ActionButtons';

export default function LogSessionPage() {
  // Custom hooks for business logic
  const { workoutId, currentExerciseIndex, workout, currentExercise, navigateToNextExercise, finishWorkout } = useWorkoutSession();
  const { elapsedTime, formatTime } = useWorkoutTimer(workoutId);
  const { completedSets, setValues, toggleSetCompletion, updateSetValue, addSet } = useSetTracking(currentExercise);
  
  // Check if this is a bodyweight exercise (all sets have weight = 0)
  const isBodyweightExercise = currentExercise?.sets.every((set: {weight: number}) => set.weight === 0) || false;
  
  // Event handlers
  const handleCompleteSet = () => {
    navigateToNextExercise();
  };
  
  const handleFinishWorkout = () => {
    finishWorkout(elapsedTime);
  };
  
  if (!workout || !currentExercise) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Workout not found</h1>
        <Link href="/workout" className="text-cyan-400 mt-4 block">← Back to workouts</Link>
      </div>
    );
  }
  return (
    <div className="px-6 py-8 pb-32">
      <WorkoutHeader 
        workout={workout}
        currentExerciseIndex={currentExerciseIndex}
        workoutId={workoutId!}
        elapsedTime={elapsedTime}
        formatTime={formatTime}
      />

      <ExerciseCard
        currentExercise={currentExercise}
        isBodyweightExercise={isBodyweightExercise}
        completedSets={completedSets}
        setValues={setValues}
        toggleSetCompletion={toggleSetCompletion}
        updateSetValue={updateSetValue}
      />

      <ActionButtons
        onCompleteSet={handleCompleteSet}
        onAddSet={addSet}
      />

      {/* Finish Button */}
      <div className="fixed bottom-24 left-6 right-6">
        <button 
          onClick={handleFinishWorkout}
          className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block cursor-pointer"
        >
          Finish Workout
        </button>
      </div>
    </div>
  );
}
