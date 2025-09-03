'use client';

import Link from 'next/link';

interface ExerciseAnalytics {
  id: string;
  name: string;
  muscleGroup: string | null;
  peakPerformance: {
    weight: number;
    reps: number;
    isBodyweight: boolean;
  } | null;
  devotionDots: boolean[]; // Variable length array (1-12 weeks of activity)
  actualWeeksTracked: number; // Actual number of weeks being displayed (1-12)
  consistency: number; // 0-1 representing percentage
  chips: ('foundation' | 'missing')[];
}

interface ExerciseListCardProps {
  exercise: ExerciseAnalytics;
  isArchived?: boolean;
}

export function ExerciseListCard({ exercise, isArchived = false }: ExerciseListCardProps) {
  const formatPeakPerformance = () => {
    if (!exercise.peakPerformance) return null;
    
    const { weight, reps, isBodyweight } = exercise.peakPerformance;
    
    if (isBodyweight) {
      return `Bodyweight × ${reps}`;
    }
    
    return `${weight}kg × ${reps}`;
  };

  return (
    <Link href={`/exercise/${exercise.id}`} className="block">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 truncate mb-1">
            {exercise.name}
          </h3>
          {exercise.muscleGroup && (
            <p className="text-sm text-gray-600 truncate">
              {exercise.muscleGroup}
            </p>
          )}
        </div>

        {/* Peak Performance */}
        {exercise.peakPerformance && (
          <div className="mb-3">
            <p className="text-sm text-gray-600">
              Strongest moment: {formatPeakPerformance()}
            </p>
          </div>
        )}

        {/* Devotion Dots and Chips - only show for active exercises */}
        {!isArchived && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {exercise.devotionDots.map((isActive, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      isActive 
                        ? 'bg-lime-400' 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 ml-1">
                {exercise.actualWeeksTracked > 0 
                  ? `Last ${exercise.actualWeeksTracked} week${exercise.actualWeeksTracked === 1 ? '' : 's'}`
                  : 'No activity yet'
                }
              </span>
            </div>
            
            {/* Chips */}
            {exercise.chips.length > 0 && (
              <div className="flex gap-1.5">
                {exercise.chips.map((chip, index) => (
                  <span
                    key={`${chip}-${index}`}
                    className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700"
                  >
                    {chip === 'foundation' ? 'Foundation' : 'Missing'}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}