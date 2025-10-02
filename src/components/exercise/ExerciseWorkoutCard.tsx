'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ExerciseListItem } from '@/lib/types/exercise';

interface ExerciseWorkoutCardProps {
  exercise: ExerciseListItem;
}

export function ExerciseWorkoutCard({ exercise }: ExerciseWorkoutCardProps) {
  const details = [exercise.muscleGroup, exercise.equipment].filter(Boolean).join(' • ');

  return (
    <Link
      href={`/exercise/${exercise.id}/edit`}
      className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-cyan-300 transition-colors"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{exercise.name}</h3>
          {details && (
            <p className="text-sm text-gray-500">{details}</p>
          )}
        </div>
        <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
      </div>
    </Link>
  );
}
