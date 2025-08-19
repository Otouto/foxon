'use client';

import { Calendar, TrendingUp } from 'lucide-react';

interface EmptyStateProps {
  type: 'sessions' | 'exercises';
}

export function EmptyState({ type }: EmptyStateProps) {
  const config = {
    sessions: {
      icon: Calendar,
      title: 'No sessions yet',
      description: 'Complete your first workout to see your session history here.'
    },
    exercises: {
      icon: TrendingUp,
      title: 'No exercise data',
      description: 'Complete some workouts to see your exercise statistics and progress.'
    }
  };

  const { icon: Icon, title, description } = config[type];

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
      <div className="flex flex-col items-center space-y-4">
        <Icon size={48} className="text-gray-400" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
