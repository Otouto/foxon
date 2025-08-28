interface AlternativeWorkSectionProps {
  alternativeExercises: {
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
  }[];
}

export function AlternativeWorkSection({ alternativeExercises }: AlternativeWorkSectionProps) {
  // Don't render if no alternative exercises
  if (!alternativeExercises || alternativeExercises.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Alternative Work</h3>
      
      {alternativeExercises.map((sessionExercise) => (
        <div key={sessionExercise.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="mb-3">
            <h4 className="font-medium text-gray-900">{sessionExercise.exercise.name}</h4>
          </div>
          
          {/* Sets - all show as completed since they were performed */}
          <div className="space-y-1.5">
            {sessionExercise.sessionSets
              .filter(set => set.completed) // Only show completed sets in alternative work
              .map((set) => (
                <div 
                  key={set.id} 
                  className="rounded-lg px-3 py-2 text-sm bg-lime-50 border border-lime-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Set {set.order}</span>
                    <span className="text-lime-800 font-medium">
                      {set.reps} reps × {set.load > 0 ? `${set.load}kg` : 'Bodyweight'}
                    </span>
                  </div>
                  {set.notes && (
                    <div className="mt-1 text-xs text-gray-500 italic">
                      {set.notes}
                    </div>
                  )}
                </div>
              ))}
          </div>
          
          {sessionExercise.notes && (
            <p className="text-xs text-gray-500 italic mt-3">💡 {sessionExercise.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}