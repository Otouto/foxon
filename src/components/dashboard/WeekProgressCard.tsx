'use client';

import { useEffect, useMemo } from 'react';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { DashboardCache } from '@/lib/dashboardCache';

interface WeekProgressCardProps {
  completed: number;
  planned: number;
  isComplete: boolean;
  isExceeded?: boolean;
  extra?: number;
}

export function WeekProgressCard({ completed, planned, isComplete, isExceeded, extra }: WeekProgressCardProps) {
  const cached = useMemo(() => DashboardCache.getWeekProgress(), []);
  const hasChange = cached !== null && (
    cached.completed !== completed || cached.planned !== planned
  );

  const animatedCompleted = useAnimatedValue(
    hasChange ? cached!.completed : completed,
    completed,
    600,
    400
  );

  useEffect(() => {
    DashboardCache.setWeekProgress({ completed, planned });
  }, [completed, planned]);

  const percentage = (animatedCompleted / planned) * 100;
  const remaining = planned - completed;

  const getStatusMessage = () => {
    if (completed === 0) return "Let's get moving";
    if (isExceeded && extra) return `Week complete! 🎉 (+${extra})`;
    if (isComplete) return 'Week complete! 🎉';
    return `${remaining} more workout${remaining !== 1 ? 's' : ''} to level up! 🚀`;
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">This Week</h2>

      {/* Progress Stats */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600">Progress</span>
        <span className="text-sm font-medium text-gray-900">
          {animatedCompleted} of {planned} workouts
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-lime-400 h-2 rounded-full"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Status Message */}
      <p className="text-sm text-gray-600">
        {getStatusMessage()}
      </p>
    </div>
  );
}
