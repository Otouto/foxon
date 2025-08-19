import Link from 'next/link';
import { Plus } from 'lucide-react';
import { WorkoutService } from '@/services/WorkoutService';
import { WorkoutCard } from '@/components/workout/WorkoutCard';

export default async function WorkoutPage() {
  // Fetch real workouts from Supabase database
  const workouts = await WorkoutService.getUserWorkouts();

  return (
    <div className="px-6 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
      </div>

      {workouts.length > 0 ? (
        /* Workout List */
        <div className="space-y-4">
          {workouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
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
      <div className="fixed bottom-24 left-6 right-6">
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
