'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSession, updateSession, type Session, type SessionExercise } from '@/lib/seedData';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { ActionButtons } from '@/components/workout/ActionButtons';

export default function SessionLogPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [currentExercise, setCurrentExercise] = useState<SessionExercise | null>(null);
  const [completedSets, setCompletedSets] = useState<boolean[]>([]);
  const [setValues, setSetValues] = useState<Array<{weight: number, reps: number}>>([]);
  
  const { elapsedTime, formatTime } = useWorkoutTimer(sessionId);
  
  useEffect(() => {
    const sessionData = getSession(sessionId);
    if (!sessionData) {
      router.push('/workout');
      return;
    }
    
    setSession(sessionData);
    const currentEx = sessionData.exercises[sessionData.current_exercise_index];
    setCurrentExercise(currentEx);
    
    if (currentEx) {
      setCompletedSets(currentEx.sets.map(set => set.completed));
      setSetValues(currentEx.sets.map(set => ({ weight: set.load, reps: set.reps })));
    }
  }, [sessionId, router]);

  const toggleSetCompletion = (setIndex: number) => {
    if (!session || !currentExercise) return;
    
    const newCompletedSets = [...completedSets];
    newCompletedSets[setIndex] = !newCompletedSets[setIndex];
    setCompletedSets(newCompletedSets);
    
    // Update session data
    const updatedExercises = [...session.exercises];
    updatedExercises[session.current_exercise_index].sets[setIndex].completed = newCompletedSets[setIndex];
    
    updateSession(sessionId, { exercises: updatedExercises });
  };

  const updateSetValue = (setIndex: number, field: 'weight' | 'reps', value: number) => {
    if (!session || !currentExercise) return;
    
    const newSetValues = [...setValues];
    newSetValues[setIndex] = { ...newSetValues[setIndex], [field]: value };
    setSetValues(newSetValues);
    
    // Update session data
    const updatedExercises = [...session.exercises];
    const fieldName = field === 'weight' ? 'load' : 'reps';
    updatedExercises[session.current_exercise_index].sets[setIndex][fieldName] = value;
    
    updateSession(sessionId, { exercises: updatedExercises });
  };

  const addSet = () => {
    if (!session || !currentExercise) return;
    
    const newSet = {
      id: `set_${sessionId}_${session.current_exercise_index}_${currentExercise.sets.length}`,
      type: 'NORMAL' as const,
      load: setValues[setValues.length - 1]?.weight || 0,
      reps: setValues[setValues.length - 1]?.reps || 0,
      completed: false,
      order: currentExercise.sets.length
    };
    
    const updatedExercises = [...session.exercises];
    updatedExercises[session.current_exercise_index].sets.push(newSet);
    
    const updatedSession = updateSession(sessionId, { exercises: updatedExercises });
    if (updatedSession) {
      setSession(updatedSession);
      setCurrentExercise(updatedSession.exercises[updatedSession.current_exercise_index]);
      setCompletedSets([...completedSets, false]);
      setSetValues([...setValues, { weight: newSet.load, reps: newSet.reps }]);
    }
  };

  const navigateToNextExercise = () => {
    if (!session) return;
    
    if (session.current_exercise_index + 1 < session.exercises.length) {
      // Move to next exercise
      const updatedSession = updateSession(sessionId, { 
        current_exercise_index: session.current_exercise_index + 1 
      });
      
      if (updatedSession) {
        setSession(updatedSession);
        const nextExercise = updatedSession.exercises[updatedSession.current_exercise_index];
        setCurrentExercise(nextExercise);
        setCompletedSets(nextExercise.sets.map(set => set.completed));
        setSetValues(nextExercise.sets.map(set => ({ weight: set.load, reps: set.reps })));
      }
    } else {
      // Finish workout
      router.push(`/session/${sessionId}/finish`);
    }
  };

  const finishWorkout = () => {
    router.push(`/session/${sessionId}/finish`);
  };

  if (!session || !currentExercise) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Session not found</h1>
        <Link href="/workout" className="text-cyan-400 mt-4 block">← Back to workouts</Link>
      </div>
    );
  }

  // Check if this is a bodyweight exercise
  const isBodyweightExercise = currentExercise.sets.every(set => set.load === 0);
  
  // Convert session data to format expected by existing components
  const workoutForHeader = {
    name: session.workout_name,
    exercises: session.exercises.length
  };
  
  const exerciseForCard = {
    name: currentExercise.exercise_name,
    sets: currentExercise.sets.map(set => ({ weight: set.load, reps: set.reps })),
    previousSession: currentExercise.sets.map(set => ({ weight: set.load, reps: set.reps }))
  };

  return (
    <div className="px-6 py-8 pb-32">
      <WorkoutHeader 
        workout={workoutForHeader}
        currentExerciseIndex={session.current_exercise_index}
        workoutId={session.workout_id}
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
