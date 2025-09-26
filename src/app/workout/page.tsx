'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WorkoutCard } from '@/components/workout/WorkoutCard';
import { WorkoutGroup } from '@/components/workout/WorkoutGroup';
import { WorkoutLoadingState } from '@/components/workout/WorkoutLoadingState';
import { useWorkoutPreload } from '@/hooks/useWorkoutPreload';
import type { WorkoutListItem, CategorizedWorkouts } from '@/lib/types/workout';

export default function WorkoutPage() {
  const [categorizedWorkouts, setCategorizedWorkouts] = useState<CategorizedWorkouts>({
    activeWorkouts: [],
    draftWorkouts: [],
    archivedWorkouts: [],
  });
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

        // Categorize workouts by status
        const categorized: CategorizedWorkouts = {
          activeWorkouts: workoutData.filter((w: WorkoutListItem) => w.status === 'ACTIVE'),
          draftWorkouts: workoutData.filter((w: WorkoutListItem) => w.status === 'DRAFT'),
          archivedWorkouts: workoutData.filter((w: WorkoutListItem) => w.status === 'ARCHIVED'),
        };

        setCategorizedWorkouts(categorized);
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
      <div className="px-6 py-8 pb-above-nav">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
        </div>
        <WorkoutLoadingState />
        
        {/* Create Workout Button */}
        <div className="fixed bottom-above-nav left-6 right-6">
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
    <div className="px-6 py-8 pb-above-nav">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
      </div>

{categorizedWorkouts.activeWorkouts.length > 0 ||
      categorizedWorkouts.draftWorkouts.length > 0 ||
      categorizedWorkouts.archivedWorkouts.length > 0 ? (
        /* Workout List - Organized by Status */
        <div className="space-y-6">
          {/* Active Workouts - Always Visible */}
          {categorizedWorkouts.activeWorkouts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Workouts</h2>
              <div className="space-y-4">
                {categorizedWorkouts.activeWorkouts.map((workout) => (
                  <WorkoutCard key={workout.id} workout={workout} />
                ))}
              </div>
            </div>
          )}

          {/* Draft Workouts - Collapsible */}
          {categorizedWorkouts.draftWorkouts.length > 0 && (
            <WorkoutGroup
              group={{
                key: 'draft',
                title: 'Draft Workouts',
                workouts: categorizedWorkouts.draftWorkouts,
                count: categorizedWorkouts.draftWorkouts.length,
              }}
              defaultExpanded={false}
            />
          )}

          {/* Archived Workouts - Collapsible */}
          {categorizedWorkouts.archivedWorkouts.length > 0 && (
            <WorkoutGroup
              group={{
                key: 'archived',
                title: 'Archived Workouts',
                workouts: categorizedWorkouts.archivedWorkouts,
                count: categorizedWorkouts.archivedWorkouts.length,
              }}
              defaultExpanded={false}
            />
          )}
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
      <div className="fixed bottom-above-nav left-6 right-6">
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
