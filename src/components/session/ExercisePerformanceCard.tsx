interface TemplateSet {
  type: string;
  targetLoad: number;
  targetReps: number;
  order: number;
}

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
  templateSets?: TemplateSet[]; // Optional template sets for comparison
  muscleGroup?: string; // Optional muscle group name
}

export function ExercisePerformanceCard({ sessionExercise, exerciseNumber, templateSets, muscleGroup }: ExercisePerformanceCardProps) {
  const completedSetsCount = sessionExercise.sessionSets.filter(set => set.completed).length;
  const totalSetsCount = templateSets ? templateSets.length : sessionExercise.sessionSets.length;

  // Helper to find template set for a given session set
  const getTemplateSet = (sessionSet: any): TemplateSet | null => {
    if (!templateSets) return null;
    return templateSets.find(t => t.order === sessionSet.order) || null;
  };

  // Helper to format set display with template comparison
  const formatSetDisplay = (sessionSet: any, templateSet: TemplateSet | null) => {
    // Handle case where no session set exists (template set but not performed)
    if (!sessionSet) {
      return {
        text: '— not completed —',
        className: 'text-gray-500'
      };
    }

    const actualReps = sessionSet.reps;
    const actualLoad = sessionSet.load;
    const isBodyweight = actualLoad === 0;

    if (!sessionSet.completed) {
      return {
        text: '— not completed —',
        className: 'text-gray-500'
      };
    }

    if (!templateSet) {
      // No template to compare against (alternative work)
      return {
        text: `${actualReps} reps × ${isBodyweight ? 'Bodyweight' : `${actualLoad}kg`}`,
        className: 'text-lime-800 font-medium'
      };
    }

    const targetReps = templateSet.targetReps;
    const targetLoad = Number(templateSet.targetLoad);
    const repsDiff = actualReps - targetReps;
    const loadDiff = actualLoad - targetLoad;

    // Check if performance matches template exactly
    if (repsDiff === 0 && loadDiff === 0) {
      return {
        text: `${actualReps} reps × ${isBodyweight ? 'Bodyweight' : `${actualLoad}kg`}`,
        className: 'text-lime-800 font-medium'
      };
    }

    // Performance differs from template - show difference
    let differenceText = '';
    const differences = [];
    
    if (repsDiff !== 0) {
      differences.push(`${repsDiff > 0 ? '+' : ''}${repsDiff} reps`);
    }
    if (loadDiff !== 0) {
      differences.push(`${loadDiff > 0 ? '+' : ''}${loadDiff}kg`);
    }
    
    if (differences.length > 0) {
      differenceText = ` (${differences.join(', ')})`;
    }

    return {
      text: `${actualReps} reps × ${isBodyweight ? 'Bodyweight' : `${actualLoad}kg`}${differenceText}`,
      className: 'text-lime-800 font-medium'
    };
  };

  // Create a complete list of sets (template + any additional session sets)
  const allSets = [];
  
  if (templateSets) {
    // Start with template sets
    templateSets.forEach(templateSet => {
      const sessionSet = sessionExercise.sessionSets.find(s => s.order === templateSet.order);
      allSets.push({ templateSet, sessionSet });
    });
    
    // Add any additional session sets not in template
    sessionExercise.sessionSets.forEach(sessionSet => {
      if (!templateSets.find(t => t.order === sessionSet.order)) {
        allSets.push({ templateSet: null, sessionSet });
      }
    });
  } else {
    // No template - just show session sets
    sessionExercise.sessionSets.forEach(sessionSet => {
      allSets.push({ templateSet: null, sessionSet });
    });
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">
            {exerciseNumber}. {sessionExercise.exercise.name}
          </h4>
          <p className="text-sm text-gray-500">
            {completedSetsCount} of {totalSetsCount} sets{muscleGroup && ` • ${muscleGroup}`}
          </p>
        </div>
      </div>
      
      {/* Sets breakdown */}
      <div className="space-y-1.5">
        {allSets.map((setData, index) => {
          const { templateSet, sessionSet } = setData;
          const setNumber = templateSet?.order || sessionSet?.order || index + 1;
          const setDisplay = formatSetDisplay(sessionSet, templateSet);
          
          return (
            <div 
              key={sessionSet?.id || `template-${setNumber}`}
              className={`rounded-lg px-3 py-2 text-sm ${
                sessionSet?.completed 
                  ? 'bg-lime-50 border border-lime-200' 
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Set {setNumber}</span>
                <span className={setDisplay.className}>
                  {setDisplay.text}
                </span>
              </div>
              {sessionSet?.notes && (
                <div className="mt-1 text-xs text-gray-500 italic">
                  {sessionSet.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {sessionExercise.notes && (
        <p className="text-xs text-gray-500 italic mt-3">💡 {sessionExercise.notes}</p>
      )}
    </div>
  );
}