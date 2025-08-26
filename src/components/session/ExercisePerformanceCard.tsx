interface ExercisePerformanceCardProps {
  sessionExercise: {
    id: string;
    order: number;
    notes: string | null;
    exercise: {
      id: string;
      name: string;
    };
    sessionSets: {
      id: string;
      type: string;
      load: number;
      reps: number;
      completed: boolean;
      order: number;
      notes: string | null;
    }[];
  };
  exerciseNumber: number;
}

export function ExercisePerformanceCard({ sessionExercise, exerciseNumber }: ExercisePerformanceCardProps) {
  const completedSetsCount = sessionExercise.sessionSets.filter(set => set.completed).length;
  const totalSetsCount = sessionExercise.sessionSets.length;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{sessionExercise.exercise.name}</h4>
          <p className="text-sm text-gray-500">
            {completedSetsCount} of {totalSetsCount} sets completed
          </p>
        </div>
        <div className="text-sm text-gray-400 font-medium">{exerciseNumber}</div>
      </div>
      
      {/* Sets breakdown */}
      <div className="space-y-2 mb-3">
        {sessionExercise.sessionSets.map((set) => (
          <div 
            key={set.id} 
            className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
              set.completed 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <span className={`${set.completed ? 'text-green-700' : 'text-gray-600'}`}>
              Set {set.order}
              {set.type === 'WARMUP' && <span className="text-orange-500 ml-1">(Warmup)</span>}
            </span>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${set.completed ? 'text-green-900' : 'text-gray-900'}`}>
                {set.reps} reps × {set.load > 0 ? `${set.load}kg` : 'Bodyweight'}
                {set.notes && <span className="text-gray-500 ml-2">({set.notes})</span>}
              </span>
              {set.completed && (
                <span className="text-green-600">✓</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {sessionExercise.notes && (
        <p className="text-xs text-gray-500 italic">💡 {sessionExercise.notes}</p>
      )}
    </div>
  );
}