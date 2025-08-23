'use client';

import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import { useWorkoutPreload } from '@/hooks/useWorkoutPreload';
import type { WorkoutListItem } from '@/lib/types/workout';

interface WorkoutCardProps {
  workout: WorkoutListItem;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const router = useRouter();
  const { getPreloadedWorkout } = useWorkoutPreload();

  const handleStartSession = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if we have preloaded data
    const preloadedData = getPreloadedWorkout(workout.id);
    
    if (preloadedData) {
      // Direct navigation with preloaded data - no redirects needed!
      router.push(`/session/log?workoutId=${workout.id}&preloaded=true`);
    } else {
      // Fallback: preload the workout and then navigate
      try {
        const response = await fetch(`/api/workouts/${workout.id}/preload`);
        if (response.ok) {
          router.push(`/session/log?workoutId=${workout.id}&preloaded=true`);
        } else {
          router.push(`/session/log?workoutId=${workout.id}&preloaded=false`);
        }
      } catch (error) {
        console.warn('Failed to preload workout data:', error);
        router.push(`/session/log?workoutId=${workout.id}&preloaded=false`);
      }
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => router.push(`/workout/${workout.id}`)}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{workout.title}</h3>
            <p className="text-sm text-gray-500">
              {workout.exerciseCount} exercises • {workout.estimatedDuration} min
            </p>
            {workout.description && (
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                {workout.description}
              </p>
            )}
          </div>
          <button
            onClick={handleStartSession}
            className="bg-lime-400 text-black p-3 rounded-full hover:bg-lime-500 transition-colors"
          >
            <Play size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
