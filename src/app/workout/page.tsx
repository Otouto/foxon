'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WorkoutCard } from '@/components/workout/WorkoutCard';
import { WorkoutLoadingState } from '@/components/workout/WorkoutLoadingState';
import { useWorkoutPreload } from '@/hooks/useWorkoutPreload';
import type { WorkoutListItem } from '@/lib/types/workout';

export default function WorkoutPage() {
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const { preloadWorkouts } = useWorkoutPreload();

  useEffect(() => {
    // Only load once per component mount
    if (hasLoaded) return;

    async function loadWorkouts() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch workouts from API
        const response = await fetch('/api/workouts');
        if (!response.ok) {
          throw new Error('Failed to load workouts');
        }

        const { workouts: workoutData } = await response.json();
        setWorkouts(workoutData);
        setHasLoaded(true);

        // Start preloading workout data in the background (fire and forget)
        if (workoutData.length > 0) {
          preloadWorkouts(workoutData).catch(console.error);
        }
      } catch (error) {
        console.error('Failed to load workouts:', error);
        setError(error instanceof Error ? error.message : 'Failed to load workouts');
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkouts();
  }, [hasLoaded, preloadWorkouts]); // Include dependencies

  if (isLoading) {
    return (
      <div className="px-6 py-8 pb-24">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
        </div>
        <WorkoutLoadingState />
        
        {/* Create Workout Button */}
        <div className="fixed bottom-24 left-6 right-6">
          <Link 
            href="/workout/create"
            className="w-full bg-cyan-400 text-white font-semibold py-4 rounded-2xl text-center block flex items-center justify-center gap-3"
          >
            <Plus size={20} />
            Create New Workout
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-8 pb-24">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
        </div>
        <div className="text-center py-12 text-red-500">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 text-cyan-400 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
      </div>

      {workouts.length > 0 ? (
        /* Workout List */
        <div className="space-y-4">
          {workouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      ) : (
        /* Empty State for New Users */
        <div className="text-center py-12 text-gray-500">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💪</span>
            </div>
            <p className="text-sm">Create your first workout to get started</p>
          </div>
        </div>
      )}

      {/* Create Workout Button */}
      <div className="fixed bottom-24 left-6 right-6">
        <Link 
          href="/workout/create"
          className="w-full bg-cyan-400 text-white font-semibold py-4 rounded-2xl text-center block flex items-center justify-center gap-3"
        >
          <Plus size={20} />
          Create New Workout
        </Link>
      </div>
    </div>
  );
}
