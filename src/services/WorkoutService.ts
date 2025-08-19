import { workoutSeedData, type Workout, type Exercise } from '@/lib/seedData';

/**
 * Service for workout data operations
 * Provides a clean interface for workout data access and future extensibility
 */
class WorkoutService {
  /**
   * Get workout by ID
   */
  getWorkout(workoutId: string): Workout | null {
    try {
      return workoutSeedData[workoutId] || null;
    } catch (error) {
      console.error('Failed to get workout:', error);
      return null;
    }
  }

  /**
   * Get specific exercise from a workout
   */
  getExercise(workoutId: string, exerciseIndex: number): Exercise | null {
    try {
      const workout = this.getWorkout(workoutId);
      if (!workout || exerciseIndex < 0 || exerciseIndex >= workout.exercises_list.length) {
        return null;
      }
      return workout.exercises_list[exerciseIndex];
    } catch (error) {
      console.error('Failed to get exercise:', error);
      return null;
    }
  }

  /**
   * Check if there's a next exercise in the workout
   */
  hasNextExercise(workoutId: string, currentIndex: number): boolean {
    try {
      const workout = this.getWorkout(workoutId);
      return workout ? currentIndex + 1 < workout.exercises_list.length : false;
    } catch (error) {
      console.error('Failed to check next exercise:', error);
      return false;
    }
  }

  /**
   * Get all available workouts
   */
  getAllWorkouts(): Workout[] {
    try {
      return Object.values(workoutSeedData);
    } catch (error) {
      console.error('Failed to get all workouts:', error);
      return [];
    }
  }

  /**
   * Get workout IDs
   */
  getWorkoutIds(): string[] {
    try {
      return Object.keys(workoutSeedData);
    } catch (error) {
      console.error('Failed to get workout IDs:', error);
      return [];
    }
  }

  /**
   * Get previous session data for a specific exercise
   */
  getPreviousSessionData(workoutId: string, exerciseIndex: number): Exercise['previousSession'] {
    try {
      const exercise = this.getExercise(workoutId, exerciseIndex);
      return exercise?.previousSession || null;
    } catch (error) {
      console.error('Failed to get previous session data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const workoutService = new WorkoutService();
