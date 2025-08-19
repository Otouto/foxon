'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface WorkoutHeaderProps {
  workout: {
    name: string;
    exercises: number;
  };
  currentExerciseIndex: number;
  workoutId: string;
  elapsedTime: number;
  formatTime: (seconds: number) => string;
}

export function WorkoutHeader({ 
  workout, 
  currentExerciseIndex, 
  workoutId, 
  elapsedTime, 
  formatTime 
}: WorkoutHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Link href={`/workout/${workoutId}`} className="p-2 -ml-2 cursor-pointer">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{workout.name}</h1>
          <p className="text-sm text-gray-500">
            Exercise {currentExerciseIndex + 1} of {workout.exercises}
          </p>
        </div>
      </div>
      <div className="text-sm text-gray-500">{formatTime(elapsedTime)}</div>
    </div>
  );
}
