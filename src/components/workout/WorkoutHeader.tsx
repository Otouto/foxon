'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface WorkoutHeaderProps {
  workout: {
    name: string;
    exercises: number;
    blockLabel?: string | null;
  };
  currentExerciseIndex: number;
  workoutId: string;
  elapsedTime: number;
  formatTime: (seconds: number) => string;
  onBackClick?: () => void;
}

export function WorkoutHeader({ 
  workout, 
  currentExerciseIndex, 
  workoutId, 
  elapsedTime, 
  formatTime,
  onBackClick 
}: WorkoutHeaderProps) {
  const progress = ((currentExerciseIndex + 1) / workout.exercises) * 100;

  return (
    <div className="session-header">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {onBackClick ? (
            <button onClick={onBackClick} className="p-2 -ml-2 touch-target">
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
          ) : (
            <Link href={`/workout/${workoutId}`} className="p-2 -ml-2 touch-target">
              <ArrowLeft size={24} className="text-gray-700" />
            </Link>
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">
              {workout.blockLabel || workout.name}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {workout.blockLabel ? (
                <>{workout.blockLabel} • {workout.name}</>
              ) : (
                <>Exercise {currentExerciseIndex + 1} of {workout.exercises}</>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900 tabular-nums">{formatTime(elapsedTime)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Elapsed</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
        <div
          className="bg-lime-400 h-1.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
