'use client';

import { Check } from 'lucide-react';

interface SetValue {
  weight: number;
  reps: number;
}

interface Exercise {
  name: string;
  sets: SetValue[];
}

interface ExerciseCardProps {
  currentExercise: Exercise;
  isBodyweightExercise: boolean;
  completedSets: boolean[];
  setValues: SetValue[];
  toggleSetCompletion: (setIndex: number) => void;
  updateSetValue: (setIndex: number, field: 'weight' | 'reps', value: number) => void;
}

export function ExerciseCard({
  currentExercise,
  isBodyweightExercise,
  completedSets,
  setValues,
  toggleSetCompletion,
  updateSetValue
}: ExerciseCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{currentExercise.name}</h2>
      
      {/* Column Headers */}
      <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-100">
        <div className="w-6"></div> {/* Space for check icon */}
        <div className={`flex-1 grid gap-2 text-center ${isBodyweightExercise ? 'grid-cols-3' : 'grid-cols-4'}`}>
          <p className="text-xs text-gray-500 font-medium">SET</p>
          <p className="text-xs text-gray-500 font-medium">PREVIOUS</p>
          {!isBodyweightExercise && <p className="text-xs text-gray-500 font-medium">KG</p>}
          <p className="text-xs text-gray-500 font-medium">REPS</p>
        </div>
      </div>
      
      {/* Sets */}
      <div className="space-y-3">
        {setValues.map((set, index) => {
          // Mock previous session data - in real app this would come from database
          const previousSet = {
            weight: isBodyweightExercise ? 0 : (index === 0 ? 24 : 28),
            reps: isBodyweightExercise 
              ? (index === 0 ? 8 : index === 1 ? 6 : index === 2 ? 4 : Math.max(4 - (index - 2), 1))
              : 12
          };
          
          return (
            <div 
              key={index}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                completedSets[index] 
                  ? 'bg-lime-50 border border-lime-200' 
                  : 'bg-gray-50'
              }`}
            >
              <button 
                onClick={() => toggleSetCompletion(index)}
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  completedSets[index]
                    ? 'bg-lime-400'
                    : 'bg-gray-300'
                }`}
              >
                <Check size={14} className={completedSets[index] ? "text-black" : "text-gray-500"} />
              </button>
              
              <div className={`flex-1 grid gap-2 items-center text-center ${isBodyweightExercise ? 'grid-cols-3' : 'grid-cols-4'}`}>
                <div>
                  <p className="font-medium text-gray-900">{index + 1}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    {isBodyweightExercise ? `${previousSet.reps}` : `${previousSet.weight}kg × ${previousSet.reps}`}
                  </p>
                </div>
                {!isBodyweightExercise && (
                  <div>
                    {completedSets[index] ? (
                      <p className="font-medium text-gray-900">{setValues[index]?.weight || set.weight}</p>
                    ) : (
                      <input 
                        type="number" 
                        value={setValues[index]?.weight || set.weight}
                        onChange={(e) => updateSetValue(index, 'weight', parseInt(e.target.value) || 0)}
                        className="w-16 text-center font-medium bg-transparent border-b border-gray-400 focus:outline-none focus:border-cyan-400 text-gray-900"
                      />
                    )}
                  </div>
                )}
                <div>
                  {completedSets[index] ? (
                    <p className="font-medium text-gray-900">{setValues[index]?.reps || set.reps}</p>
                  ) : (
                    <input 
                      type="number" 
                      value={setValues[index]?.reps || set.reps}
                      onChange={(e) => updateSetValue(index, 'reps', parseInt(e.target.value) || 0)}
                      className="w-16 text-center font-medium bg-transparent border-b border-gray-400 focus:outline-none focus:border-cyan-400 text-gray-900"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
