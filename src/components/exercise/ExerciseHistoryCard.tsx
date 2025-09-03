'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/utils/dateUtils';

interface ExerciseHistoryEntry {
  id: string;
  date: Date;
  workoutTitle: string | null;
  duration: number | null;
  devotionScore: number | null;
  sessionExercise: {
    id: string;
    order: number;
    notes: string | null;
    exercise: {
      name: string;
      muscleGroup: {
        name: string;
      } | null;
    };
    sessionSets: {
      id: string;
      type: string;
      load: number; // Converted from Prisma Decimal
      reps: number;
      completed: boolean;
      order: number;
      notes: string | null;
    }[];
  };
}

interface ExerciseHistoryCardProps {
  historyEntry: ExerciseHistoryEntry;
  exerciseId: string;
}

export function ExerciseHistoryCard({ historyEntry, exerciseId }: ExerciseHistoryCardProps) {
  const { sessionExercise, date, workoutTitle } = historyEntry;
  const completedSets = sessionExercise.sessionSets.filter(set => set.completed);

  const formatSetDisplay = (set: typeof sessionExercise.sessionSets[0]) => {
    const load = set.load;
    const isBodyweight = load === 0;
    
    if (!set.completed) {
      return '— not completed —';
    }

    return `${set.reps} reps × ${isBodyweight ? 'Bodyweight' : `${load}kg`}`;
  };

  const formatSessionDate = (date: Date) => {
    return formatDate(new Date(date));
  };

  return (
    <Link href={`/session/${historyEntry.id}/details?from=exercise&exerciseId=${exerciseId}`} className="block">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        {/* Header with date and workout */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-medium text-gray-900">
              {formatSessionDate(date)}
            </h3>
            {workoutTitle && (
              <p className="text-sm text-gray-600">{workoutTitle}</p>
            )}
          </div>
          <div className="text-right text-sm text-gray-500">
            {completedSets.length} of {sessionExercise.sessionSets.length} sets
          </div>
        </div>

        {/* Sets breakdown */}
        <div className="space-y-1.5">
          {sessionExercise.sessionSets.map((set) => {
            return (
              <div 
                key={set.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  set.completed 
                    ? 'bg-lime-50 border border-lime-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Set {set.order}</span>
                  <span className={set.completed ? 'text-lime-800 font-medium' : 'text-gray-500'}>
                    {formatSetDisplay(set)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </Link>
  );
}