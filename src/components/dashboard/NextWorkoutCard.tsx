'use client';

import Link from 'next/link';

const WHIMSICAL_ENCOURAGEMENT_PHRASES = [
  'You crushed it this week. Fox is proud.',
  'All done. Time to rest (or do more if you\'re feeling wild).',
  'Weekly goal: achieved. You\'re on fire.',
  'Another week in the books. Well done.',
  'Fox approves. You showed up.',
];

function getEncouragementPhrase(completed: number): string {
  const index = completed % WHIMSICAL_ENCOURAGEMENT_PHRASES.length;
  return WHIMSICAL_ENCOURAGEMENT_PHRASES[index];
}

interface NextWorkoutCardProps {
  workout: {
    id: string;
    title: string;
    exerciseCount: number;
    estimatedDuration: number;
  } | null;
  isWeekComplete: boolean;
  completedThisWeek?: number;
}

export function NextWorkoutCard({
  workout,
  isWeekComplete,
  completedThisWeek = 0,
}: NextWorkoutCardProps) {
  // If week is complete, show whimsical encouragement
  if (isWeekComplete) {
    const phrase = getEncouragementPhrase(completedThisWeek);
    return (
      <div className="bg-gradient-to-br from-lime-400 to-lime-500 rounded-2xl p-8 shadow-sm">
        <div className="text-center">
          <div className="text-6xl mb-4">🦊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {phrase}
          </h2>
          <p className="text-gray-800 mb-6">
            Want to do more? Browse your workouts below.
          </p>
          <Link
            href="/workout"
            className="inline-block px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Browse workouts →
          </Link>
        </div>
      </div>
    );
  }

  // If no workout available
  if (!workout) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            No workouts yet
          </h2>
          <p className="text-gray-600 mb-6">
            Create your first workout to get started!
          </p>
          <Link 
            href="/workout/create"
            className="inline-block px-6 py-3 bg-cyan-500 text-white font-semibold rounded-xl hover:bg-cyan-600 transition-colors"
          >
            Create Workout
          </Link>
        </div>
      </div>
    );
  }

  // Show next workout
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="text-sm font-medium text-gray-500 mb-2">Up Next</h2>
      
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {workout.title}
      </h3>
      
      <Link 
        href={`/session/start?workoutId=${workout.id}`}
        className="block w-full py-4 bg-cyan-500 text-white text-center font-semibold rounded-xl hover:bg-cyan-600 transition-colors"
      >
        Start Workout
      </Link>
    </div>
  );
}

