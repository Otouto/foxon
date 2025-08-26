'use client';

import { useState } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { useReviewData } from '@/hooks/useReviewData';
import { SessionGroup } from '@/components/review/SessionGroup';
import { ExerciseStatsCard } from '@/components/review/ExerciseStatsCard';
import { LoadingState } from '@/components/review/LoadingState';
import { ErrorState } from '@/components/review/ErrorState';
import { EmptyState } from '@/components/review/EmptyState';

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'exercises'>('sessions');
  const { sessionGroups, exercises, isLoading, error, refetch, deleteSession } = useReviewData(activeTab);

  return (
    <div className="px-6 py-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Review</h1>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'sessions'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          <Calendar size={18} />
          Sessions
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'exercises'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          <TrendingUp size={18} />
          Exercises
        </button>
      </div>

      {/* Content */}
      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <LoadingState />
      ) : (
        <>
          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-6 overflow-visible">
              {sessionGroups.length === 0 ? (
                <EmptyState type="sessions" />
              ) : (
                sessionGroups.map((group) => (
                  <SessionGroup
                    key={group.key}
                    group={group}
                    onDeleteSession={deleteSession}
                  />
                ))
              )}
            </div>
          )}

          {/* Exercises Tab */}
          {activeTab === 'exercises' && (
            <div className="space-y-4">
              {exercises.length === 0 ? (
                <EmptyState type="exercises" />
              ) : (
                exercises.map((exercise) => (
                  <ExerciseStatsCard key={exercise.exerciseId} exercise={exercise} />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
