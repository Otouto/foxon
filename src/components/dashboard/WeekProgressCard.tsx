'use client';

interface WeekProgressCardProps {
  completed: number;
  planned: number;
  isComplete: boolean;
}

export function WeekProgressCard({ completed, planned, isComplete }: WeekProgressCardProps) {
  const percentage = (completed / planned) * 100;
  const remaining = planned - completed;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">This Week</h2>
      
      {/* Progress Stats */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600">Progress</span>
        <span className="text-sm font-medium text-gray-900">
          {completed} of {planned} workouts
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="bg-lime-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {/* Status Message */}
      {isComplete ? (
        <p className="text-sm text-gray-600">
          Week complete! 🎉
        </p>
      ) : (
        <p className="text-sm text-gray-600">
          {remaining} more workout{remaining !== 1 ? 's' : ''} to level up! 🚀
        </p>
      )}
    </div>
  );
}

