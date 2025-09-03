'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Calendar, TrendingUp } from 'lucide-react';
import { useReviewData } from '@/hooks/useReviewData';
import { SessionGroup } from '@/components/review/SessionGroup';
import { ExerciseListCard } from '@/components/exercise/ExerciseListCard';
import { LoadingState } from '@/components/review/LoadingState';
import { ErrorState } from '@/components/review/ErrorState';
import { EmptyState } from '@/components/review/EmptyState';

export default function ReviewPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ReviewContent />
    </Suspense>
  );
}

function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'sessions' | 'exercises'>('sessions');
  const { sessionGroups, categorizedExercises, isLoading, error, refetch, deleteSession } = useReviewData(activeTab);

  // Initialize tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'exercises' || tabParam === 'sessions') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (newTab: 'sessions' | 'exercises') => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 review-page">
      <div className="px-6 py-8 pb-24 review-page-content">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Review</h1>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => handleTabChange('sessions')}
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
            onClick={() => handleTabChange('exercises')}
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
              <div className="space-y-6">
                {!categorizedExercises || (categorizedExercises.activeExercises.length === 0 && categorizedExercises.archivedExercises.length === 0) ? (
                  <EmptyState type="exercises" />
                ) : (
                  <>
                    {/* Active Workouts Section */}
                    {categorizedExercises.activeExercises.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Workouts</h2>
                        <div className="space-y-3">
                          {categorizedExercises.activeExercises.map((exercise) => (
                            <ExerciseListCard key={exercise.id} exercise={exercise} isArchived={false} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Exercise Archive Section */}
                    {categorizedExercises.archivedExercises.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Exercise Archive</h2>
                        <div className="space-y-3">
                          {categorizedExercises.archivedExercises.map((exercise) => (
                            <ExerciseListCard key={exercise.id} exercise={exercise} isArchived={true} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
