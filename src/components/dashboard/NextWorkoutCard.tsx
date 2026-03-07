import Link from 'next/link';

interface NextWorkoutCardProps {
  workout: {
    id: string;
    title: string;
    exerciseCount: number;
    estimatedDuration: number;
  } | null;
  isWeekComplete: boolean;
}

export function NextWorkoutCard({ workout, isWeekComplete }: NextWorkoutCardProps) {
  // Hide card entirely when week is complete and user has workouts
  if (isWeekComplete && workout) {
    return null;
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
