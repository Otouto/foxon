'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, MoreVertical, Target, Archive, FileText } from 'lucide-react';
import { useState, useEffect, type ReactElement } from 'react';
import { WorkoutDetailExerciseCard } from '@/components/workout/WorkoutDetailExerciseCard';
import { ExerciseBlockContainer } from '@/components/workout/ExerciseBlockContainer';
import { WorkoutContextMenu } from '@/components/workout/WorkoutContextMenu';
import type { WorkoutDetails, WorkoutItem } from '@/lib/types/workout';

interface WorkoutDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [workout, setWorkout] = useState<WorkoutDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function loadWorkout() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/workouts/${id}`);

        if (!response.ok) {
          throw new Error('Failed to load workout');
        }

        const data = await response.json();
        setWorkout(data);
      } catch (err) {
        console.error('Failed to load workout:', err);
        setError(err instanceof Error ? err.message : 'Failed to load workout');
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkout();
  }, [id]);

  if (isLoading) {
    return (
      <div className="px-6 py-8 pb-above-nav">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/workout" className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-cyan-400 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Workout not found</h1>
        <Link href="/workout" className="text-cyan-400 mt-4 block">← Back to workouts</Link>
      </div>
    );
  }

  // Helper function to get CTA button configuration based on workout status
  const getCTAConfig = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return {
          text: 'Continue Creation',
          href: `/workout/create?edit=${id}`,
          icon: FileText,
          className: 'bg-blue-400 hover:bg-blue-500 text-white'
        };
      case 'ARCHIVED':
        return {
          text: 'Unarchive & Start',
          href: `/session/log?workoutId=${id}&preloaded=false`,
          icon: Archive,
          className: 'bg-green-400 hover:bg-green-500 text-black'
        };
      default: // ACTIVE
        return {
          text: `Start ${workout.title}`,
          href: `/session/log?workoutId=${id}&preloaded=false`,
          icon: Play,
          className: 'bg-lime-400 hover:bg-lime-500 text-black'
        };
    }
  };

  const ctaConfig = getCTAConfig(workout.status);

  const handleEdit = () => {
    router.push(`/workout/create?edit=${id}`);
  };

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive workout');
      }

      // Reload the workout data to reflect the new status
      const workoutResponse = await fetch(`/api/workouts/${id}`);
      if (workoutResponse.ok) {
        const updatedWorkout = await workoutResponse.json();
        setWorkout(updatedWorkout);
      }
    } catch (error) {
      console.error('Failed to archive workout:', error);
      setError(error instanceof Error ? error.message : 'Failed to archive workout');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="px-6 py-8 pb-above-nav">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/workout" className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workout.title}</h1>
            <p className="text-sm text-gray-500">{workout.exerciseCount} exercises • {workout.estimatedDuration} min</p>
          </div>
        </div>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 text-gray-400 hover:text-gray-600"
          disabled={isArchiving}
        >
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Workout Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center">
            <Target size={24} className="text-lime-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Workout Overview</h2>
            <p className="text-sm text-gray-500 mt-1">{workout.description || 'No description available'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{workout.exerciseCount}</p>
            <p className="text-sm text-gray-500">Exercises</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{workout.estimatedDuration}</p>
            <p className="text-sm text-gray-500">Minutes</p>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-gray-900">Exercises</h3>
        {(() => {
          // Group exercises by blockId
          const blocks = new Map<string, WorkoutItem[]>();
          const standalone: WorkoutItem[] = [];

          workout.items.forEach(item => {
            if (item.blockId) {
              if (!blocks.has(item.blockId)) {
                blocks.set(item.blockId, []);
              }
              blocks.get(item.blockId)!.push(item);
            } else {
              standalone.push(item);
            }
          });

          // Sort exercises within blocks by blockOrder
          blocks.forEach(blockItems => {
            blockItems.sort((a, b) => (a.blockOrder || 0) - (b.blockOrder || 0));
          });

          // Render exercises in order, grouping blocks together
          const rendered: ReactElement[] = [];
          const processedBlocks = new Set<string>();

          workout.items.forEach((item) => {
            if (item.blockId && !processedBlocks.has(item.blockId)) {
              // Render entire block
              processedBlocks.add(item.blockId);
              const blockItems = blocks.get(item.blockId)!;
              const blockNumber = item.blockId.replace('block-', '');

              rendered.push(
                <ExerciseBlockContainer
                  key={item.blockId}
                  blockId={item.blockId}
                  blockLabel={`Block ${blockNumber}`}
                  readonly={true}
                >
                  {blockItems.map(blockItem => (
                    <WorkoutDetailExerciseCard
                      key={blockItem.id}
                      item={blockItem}
                    />
                  ))}
                </ExerciseBlockContainer>
              );
            } else if (!item.blockId) {
              // Render standalone exercise
              rendered.push(
                <WorkoutDetailExerciseCard
                  key={item.id}
                  item={item}
                />
              );
            }
          });

          return rendered;
        })()}
      </div>

      {/* Dynamic CTA Button */}
      <div className="fixed bottom-above-nav left-6 right-6">
        <Link
          href={ctaConfig.href}
          className={`w-full font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors ${ctaConfig.className}`}
        >
          <ctaConfig.icon size={20} />
          {ctaConfig.text}
        </Link>
      </div>

      {/* Context Menu */}
      <WorkoutContextMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        workoutId={id}
        workoutName={workout.title}
        onEdit={handleEdit}
        onArchive={handleArchive}
      />
    </div>
  );
}
