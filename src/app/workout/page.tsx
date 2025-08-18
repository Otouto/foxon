'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Play } from 'lucide-react';
import { legacyWorkouts } from '@/lib/seedData';

export default function WorkoutPage() {
  const router = useRouter();

  // Using real seed data based on actual workout sessions
  const workouts = legacyWorkouts;

  return (
    <div className="px-6 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
      </div>

      {workouts.length > 0 ? (
        /* Workout List */
        <div className="space-y-4">
          {workouts.map((workout) => (
            <div 
              key={workout.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => router.push(`/workout/${workout.id}`)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{workout.name}</h3>
                    <p className="text-sm text-gray-500">{workout.exercises} exercises • {workout.duration} min</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/session/log?workout=${workout.id}`);
                    }}
                    className="bg-lime-400 text-black p-3 rounded-full hover:bg-lime-500 transition-colors"
                  >
                    <Play size={18} />
                  </button>
                </div>
              </div>
            </div>
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
