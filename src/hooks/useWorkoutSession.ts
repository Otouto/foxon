import { useSearchParams, useRouter } from 'next/navigation';
import { sessionStorageService } from '@/services/SessionStorageService';

interface UseWorkoutSessionReturn {
  workoutId: string | null;
  currentExerciseIndex: number;
  navigateToNextExercise: () => void;
  finishWorkout: (duration: number) => void;
}

export function useWorkoutSession(): UseWorkoutSessionReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const workoutId = searchParams.get('workout');
  const currentExerciseIndex = parseInt(searchParams.get('exercise') || '0');

  const navigateToNextExercise = () => {
    if (!workoutId) return;
    
    // For now, just increment the exercise index
    // In a full implementation, you'd check against the actual workout data
    const nextExerciseIndex = currentExerciseIndex + 1;
    router.push(`/session/log?workout=${workoutId}&exercise=${nextExerciseIndex}`);
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
    navigateToNextExercise,
    finishWorkout
  };
}