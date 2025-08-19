'use client';

import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import type { WorkoutListItem } from '@/lib/types/workout';

interface WorkoutCardProps {
  workout: WorkoutListItem;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const router = useRouter();

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
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/session/start?workoutId=${workout.id}`);
            }}
            className="bg-lime-400 text-black p-3 rounded-full hover:bg-lime-500 transition-colors"
          >
            <Play size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
