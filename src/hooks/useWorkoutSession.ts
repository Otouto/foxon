import { useSearchParams, useRouter } from 'next/navigation';
import { workoutService } from '@/services/WorkoutService';
import { sessionStorageService } from '@/services/SessionStorageService';

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
  const workout = workoutId ? workoutService.getWorkout(workoutId) : null;
  const currentExercise = workoutId ? workoutService.getExercise(workoutId, currentExerciseIndex) : null;

  const navigateToNextExercise = () => {
    if (!workoutId) return;
    
    if (workoutService.hasNextExercise(workoutId, currentExerciseIndex)) {
      // Go to next exercise
      const nextExerciseIndex = currentExerciseIndex + 1;
      router.push(`/session/log?workout=${workoutId}&exercise=${nextExerciseIndex}`);
    } else {
      // This is the last exercise, should finish workout
      finishWorkout(0); // Duration will be passed from timer hook
    }
  };

  const finishWorkout = (duration: number) => {
    if (!workoutId) return;
    
    // Store final duration in session storage
    sessionStorageService.setWorkoutDuration(workoutId, duration);
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
