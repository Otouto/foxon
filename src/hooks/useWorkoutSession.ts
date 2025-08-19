import { useSearchParams, useRouter } from 'next/navigation';
import { workoutSeedData } from '@/lib/seedData';

interface UseWorkoutSessionReturn {
  workoutId: string | null;
  currentExerciseIndex: number;
  workout: any;
  currentExercise: any;
  navigateToNextExercise: () => void;
  finishWorkout: (duration: number) => void;
}

export function useWorkoutSession(): UseWorkoutSessionReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const workoutId = searchParams.get('workout');
  const currentExerciseIndex = parseInt(searchParams.get('exercise') || '0');
  
  // Get workout data based on the workout parameter
  const workout = workoutId ? workoutSeedData[workoutId] : null;
  const currentExercise = workout?.exercises_list[currentExerciseIndex];

  const navigateToNextExercise = () => {
    const nextExerciseIndex = currentExerciseIndex + 1;
    if (nextExerciseIndex < (workout?.exercises_list.length || 0)) {
      // Go to next exercise
      router.push(`/session/log?workout=${workoutId}&exercise=${nextExerciseIndex}`);
    } else {
      // This is the last exercise, should finish workout
      finishWorkout(0); // Duration will be passed from timer hook
    }
  };

  const finishWorkout = (duration: number) => {
    if (!workoutId) return;
    
    // Store final duration in session storage
    sessionStorage.setItem(`workout_duration_${workoutId}`, duration.toString());
    router.push(`/session/finish?workout=${workoutId}`);
  };

  return {
    workoutId,
    currentExerciseIndex,
    workout,
    currentExercise,
    navigateToNextExercise,
    finishWorkout
  };
}
