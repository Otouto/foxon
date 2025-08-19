'use client';

import { ExerciseStatsData } from '@/hooks/useReviewData';

interface ExerciseStatsCardProps {
  exercise: ExerciseStatsData;
}

export function ExerciseStatsCard({ exercise }: ExerciseStatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-4">{exercise.exerciseName}</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Best Set</span>
          <span className="font-medium">
            {exercise.bestSet 
              ? `${exercise.bestSet.load}kg × ${exercise.bestSet.reps}`
              : 'No data'
            }
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Volume</span>
          <span className="font-medium">{exercise.totalVolume.toLocaleString()}kg</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Sessions</span>
          <span className="font-medium">{exercise.sessionCount}</span>
        </div>
      </div>
    </div>
  );
}
