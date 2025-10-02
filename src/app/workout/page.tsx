'use client';

import Link from 'next/link';
import { Plus, Dumbbell, Activity } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { WorkoutCard } from '@/components/workout/WorkoutCard';
import { WorkoutGroup } from '@/components/workout/WorkoutGroup';
import { WorkoutLoadingState } from '@/components/workout/WorkoutLoadingState';
import { ExerciseWorkoutCard } from '@/components/exercise/ExerciseWorkoutCard';
import { useWorkoutPreload } from '@/hooks/useWorkoutPreload';
import type { WorkoutListItem, CategorizedWorkouts } from '@/lib/types/workout';
import type { ExerciseListItem } from '@/lib/types/exercise';

function WorkoutPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'workouts' | 'exercises'>('workouts');

  const [categorizedWorkouts, setCategorizedWorkouts] = useState<CategorizedWorkouts>({
    activeWorkouts: [],
    draftWorkouts: [],
    archivedWorkouts: [],
  });
  const [exercises, setExercises] = useState<ExerciseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { preloadWorkouts } = useWorkoutPreload();

  // Initialize tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'exercises' || tabParam === 'workouts') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (newTab: 'workouts' | 'exercises') => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    // Only load once per component mount
    if (hasLoaded) return;

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both workouts and exercises in parallel
        const [workoutsResponse, exercisesResponse] = await Promise.all([
          fetch('/api/workouts'),
          fetch('/api/exercises')
        ]);

        if (!workoutsResponse.ok) {
          throw new Error('Failed to load workouts');
        }
        if (!exercisesResponse.ok) {
          throw new Error('Failed to load exercises');
        }

        const { workouts: workoutData } = await workoutsResponse.json();
        const { exercises: exerciseData } = await exercisesResponse.json();

        // Categorize workouts by status
        const categorized: CategorizedWorkouts = {
          activeWorkouts: workoutData.filter((w: WorkoutListItem) => w.status === 'ACTIVE'),
          draftWorkouts: workoutData.filter((w: WorkoutListItem) => w.status === 'DRAFT'),
          archivedWorkouts: workoutData.filter((w: WorkoutListItem) => w.status === 'ARCHIVED'),
        };

        setCategorizedWorkouts(categorized);
        setExercises(exerciseData);
        setHasLoaded(true);

        // Start preloading workout data in the background (fire and forget)
        if (workoutData.length > 0) {
          preloadWorkouts(workoutData).catch(console.error);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [hasLoaded, preloadWorkouts]); // Include dependencies

  if (isLoading) {
    return (
      <div className="px-6 py-8 pb-above-nav">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
        </div>

        {/* Tab Navigation - visible during loading */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => handleTabChange('workouts')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'workouts'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <Dumbbell size={18} />
            Workouts
          </button>
          <button
            onClick={() => handleTabChange('exercises')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'exercises'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <Activity size={18} />
            Exercises
          </button>
        </div>

        <WorkoutLoadingState />
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

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        <button
          onClick={() => handleTabChange('workouts')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'workouts'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          <Dumbbell size={18} />
          Workouts
        </button>
        <button
          onClick={() => handleTabChange('exercises')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'exercises'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          <Activity size={18} />
          Exercises
        </button>
      </div>

      {/* Workouts Tab */}
      {activeTab === 'workouts' && (
        <>
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
        </>
      )}

      {/* Exercises Tab */}
      {activeTab === 'exercises' && (
        <>
          {exercises.length > 0 ? (
            <div className="space-y-3">
              {exercises.map((exercise) => (
                <ExerciseWorkoutCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12 text-gray-500">
              <div className="mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏋️</span>
                </div>
                <p className="text-sm">No exercises yet</p>
              </div>
            </div>
          )}

          {/* Create Exercise Button */}
          <div className="fixed bottom-above-nav left-6 right-6">
            <Link
              href="/exercise/create"
              className="w-full bg-cyan-400 text-white font-semibold py-4 rounded-2xl text-center block flex items-center justify-center gap-3"
            >
              <Plus size={20} />
              Create New Exercise
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={<div className="px-6 py-8 pb-above-nav">Loading...</div>}>
      <WorkoutPageInner />
    </Suspense>
  );
}
