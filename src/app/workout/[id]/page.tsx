import Link from 'next/link';
import { ArrowLeft, Play, Edit, Clock, Target } from 'lucide-react';

export default function WorkoutDetailPage({ params }: { params: { id: string } }) {
  // Mock data - in a real app this would come from state/API based on params.id
  const workoutData = {
    push: {
      name: 'Push Day',
      exercises: 5,
      duration: 45,
      description: 'Upper body pushing movements focusing on chest, shoulders, and triceps',
      exercises_list: [
        { name: 'Bench Press', sets: 4, reps: '8-10', weight: '100kg', notes: 'Focus on controlled movement' },
        { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', weight: '35kg', notes: 'Full range of motion' },
        { name: 'Shoulder Press', sets: 3, reps: '10-12', weight: '25kg', notes: 'Keep core tight' },
        { name: 'Tricep Dips', sets: 3, reps: '12-15', weight: 'Bodyweight', notes: 'Control the negative' },
        { name: 'Push-ups', sets: 2, reps: '15-20', weight: 'Bodyweight', notes: 'To failure' }
      ]
    },
    pull: {
      name: 'Pull Day',
      exercises: 6,
      duration: 50,
      description: 'Upper body pulling movements targeting back, biceps, and rear delts',
      exercises_list: [
        { name: 'Deadlift', sets: 4, reps: '5-6', weight: '140kg', notes: 'Perfect form priority' },
        { name: 'Pull-ups', sets: 4, reps: '8-10', weight: 'Bodyweight', notes: 'Full hang to chest' },
        { name: 'Barbell Rows', sets: 3, reps: '8-10', weight: '80kg', notes: 'Squeeze shoulder blades' },
        { name: 'Lat Pulldowns', sets: 3, reps: '10-12', weight: '60kg', notes: 'Wide grip' },
        { name: 'Face Pulls', sets: 3, reps: '15-20', weight: '15kg', notes: 'High elbows' },
        { name: 'Bicep Curls', sets: 3, reps: '12-15', weight: '20kg', notes: 'Controlled tempo' }
      ]
    },
    legs: {
      name: 'Leg Day',
      exercises: 7,
      duration: 60,
      description: 'Lower body compound and isolation movements for complete leg development',
      exercises_list: [
        { name: 'Squats', sets: 4, reps: '8-10', weight: '120kg', notes: 'Depth is key' },
        { name: 'Romanian Deadlifts', sets: 3, reps: '10-12', weight: '100kg', notes: 'Feel the stretch' },
        { name: 'Bulgarian Split Squats', sets: 3, reps: '12-15', weight: '25kg', notes: 'Each leg' },
        { name: 'Leg Press', sets: 3, reps: '15-20', weight: '200kg', notes: 'Full range' },
        { name: 'Leg Curls', sets: 3, reps: '12-15', weight: '50kg', notes: 'Squeeze at top' },
        { name: 'Calf Raises', sets: 4, reps: '20-25', weight: '60kg', notes: 'Pause at top' },
        { name: 'Leg Extensions', sets: 3, reps: '15-20', weight: '40kg', notes: 'Control the weight' }
      ]
    }
  };

  const workout = workoutData[params.id as keyof typeof workoutData];

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
        <Link href={`/workout/${params.id}/edit`} className="p-2 text-gray-400 hover:text-gray-600">
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
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                <p className="text-sm text-gray-500">
                  {exercise.sets} sets × {exercise.reps} reps
                  {exercise.weight !== 'Bodyweight' && ` @ ${exercise.weight}`}
                </p>
              </div>
              <div className="text-sm text-gray-400 font-medium">{index + 1}</div>
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
          href={`/session/start?workout=${params.id}`}
          className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl flex items-center justify-center gap-3"
        >
          <Play size={20} />
          Start {workout.name}
        </Link>
      </div>
    </div>
  );
}
