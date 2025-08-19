import Link from 'next/link';
import { ArrowLeft, Play, Edit, Target } from 'lucide-react';
import { workoutSeedData } from '@/lib/seedData';

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Using real seed data based on actual workout sessions
  const workoutData = workoutSeedData;
  const { id } = await params;

  const workout = workoutData[id as keyof typeof workoutData];

  if (!workout) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Workout not found</h1>
        <Link href="/workout" className="text-cyan-400 mt-4 block">← Back to workouts</Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/workout" className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workout.name}</h1>
            <p className="text-sm text-gray-500">{workout.exercises} exercises • {workout.duration} min</p>
          </div>
        </div>
        <Link href={`/workout/${id}/edit`} className="p-2 text-gray-400 hover:text-gray-600">
          <Edit size={20} />
        </Link>
      </div>

      {/* Workout Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center">
            <Target size={24} className="text-lime-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Workout Overview</h2>
            <p className="text-sm text-gray-500 mt-1">{workout.description}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{workout.exercises}</p>
            <p className="text-sm text-gray-500">Exercises</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{workout.duration}</p>
            <p className="text-sm text-gray-500">Minutes</p>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-gray-900">Exercises</h3>
        {workout.exercises_list.map((exercise, index) => (
          <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                <p className="text-sm text-gray-500">
                  {exercise.sets.length} sets
                </p>
              </div>
              <div className="text-sm text-gray-400 font-medium">{index + 1}</div>
            </div>
            
            {/* Sets breakdown */}
            <div className="space-y-2 mb-3">
              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-600">Set {setIndex + 1}</span>
                  <span className="text-gray-900 font-medium">
                    {set.reps} reps × {set.weight > 0 ? `${set.weight}kg` : 'власна вага'}
                    {set.notes && set.notes !== 'власна вага' && <span className="text-gray-500 ml-2">({set.notes})</span>}
                  </span>
                </div>
              ))}
            </div>
            
            {exercise.notes && (
              <p className="text-xs text-gray-500 italic">💡 {exercise.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* Start Button */}
      <div className="fixed bottom-24 left-6 right-6">
        <Link 
          href={`/session/start?workoutId=${id}`}
          className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl flex items-center justify-center gap-3"
        >
          <Play size={20} />
          Start {workout.name}
        </Link>
      </div>
    </div>
  );
}
