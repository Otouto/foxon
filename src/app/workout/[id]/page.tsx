import Link from 'next/link';
import { ArrowLeft, Play, Edit, Target, Archive, FileText } from 'lucide-react';
import { WorkoutService } from '@/services/WorkoutService';

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch real workout from database
  const workout = await WorkoutService.getWorkoutById(id);

  if (!workout) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Workout not found</h1>
        <Link href="/workout" className="text-cyan-400 mt-4 block">← Back to workouts</Link>
      </div>
    );
  }

  // Helper function to get CTA button configuration based on workout status
  const getCTAConfig = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return {
          text: 'Continue Creation',
          href: `/workout/create?edit=${id}`,
          icon: FileText,
          className: 'bg-blue-400 hover:bg-blue-500 text-white'
        };
      case 'ARCHIVED':
        return {
          text: 'Unarchive & Start',
          href: `/session/log?workoutId=${id}&preloaded=false`,
          icon: Archive,
          className: 'bg-green-400 hover:bg-green-500 text-black'
        };
      default: // ACTIVE
        return {
          text: `Start ${workout.title}`,
          href: `/session/log?workoutId=${id}&preloaded=false`,
          icon: Play,
          className: 'bg-lime-400 hover:bg-lime-500 text-black'
        };
    }
  };

  const ctaConfig = getCTAConfig(workout.status);

  return (
    <div className="px-6 py-8 pb-above-nav">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/workout" className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workout.title}</h1>
            <p className="text-sm text-gray-500">{workout.exerciseCount} exercises • {workout.estimatedDuration} min</p>
          </div>
        </div>
        <Link href={`/workout/create?edit=${id}`} className="p-2 text-gray-400 hover:text-gray-600">
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
            <p className="text-sm text-gray-500 mt-1">{workout.description || 'No description available'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{workout.exerciseCount}</p>
            <p className="text-sm text-gray-500">Exercises</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{workout.estimatedDuration}</p>
            <p className="text-sm text-gray-500">Minutes</p>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-gray-900">Exercises</h3>
        {workout.items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.exercise.name}</h4>
                <p className="text-sm text-gray-500">
                  {item.sets.length} sets
                  {item.exercise.muscleGroup && (
                    <span className="text-gray-400"> • {item.exercise.muscleGroup.name}</span>
                  )}
                </p>
              </div>
              <div className="text-sm text-gray-400 font-medium">{item.order}</div>
            </div>
            
            {/* Sets breakdown */}
            <div className="space-y-2 mb-3">
              {item.sets.map((set) => (
                <div key={set.id} className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
                  set.type === 'WARMUP' ? 'bg-orange-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Set {set.order}</span>
                    {set.type === 'WARMUP' && (
                      <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-medium rounded-lg">
                        W
                      </span>
                    )}
                  </div>
                  <span className="text-gray-900 font-medium">
                    {set.targetReps} reps × {set.targetLoad > 0 ? `${set.targetLoad}kg` : 'Bodyweight'}
                  </span>
                </div>
              ))}
            </div>
            
            {item.notes && (
              <p className="text-xs text-gray-500 italic">💡 {item.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* Dynamic CTA Button */}
      <div className="fixed bottom-above-nav left-6 right-6">
        <Link
          href={ctaConfig.href}
          className={`w-full font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors ${ctaConfig.className}`}
        >
          <ctaConfig.icon size={20} />
          {ctaConfig.text}
        </Link>
      </div>
    </div>
  );
}
