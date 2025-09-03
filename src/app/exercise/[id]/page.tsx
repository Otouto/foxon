import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ExerciseAnalyticsService } from '@/services/ExerciseAnalyticsService';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';
import { ExerciseHistoryCard } from '@/components/exercise/ExerciseHistoryCard';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function ExerciseDetailsPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; tab?: string }>;
}) {
  const { id } = await params;
  const { from, tab } = await searchParams;
  
  // Check authentication
  if (!isAuthenticated()) {
    redirect('/');
  }

  const userId = getCurrentUserId();
  
  // Get exercise details and history
  const [exercise, exerciseHistory] = await Promise.all([
    prisma.exercise.findUnique({
      where: { id },
      include: {
        muscleGroup: {
          select: {
            name: true
          }
        }
      }
    }),
    ExerciseAnalyticsService.getExerciseHistory(id, userId)
  ]);

  if (!exercise) {
    const backUrl = from === 'review' && tab ? `/review?tab=${tab}` : '/review';
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Exercise not found</h1>
        <Link href={backUrl} className="text-cyan-400 mt-4 block">← Back to review</Link>
      </div>
    );
  }

  // Create back URL based on search parameters
  const backUrl = from === 'review' && tab ? `/review?tab=${tab}` : '/review';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={backUrl} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{exercise.name}</h1>
            {exercise.muscleGroup && (
              <p className="text-sm text-gray-600 mt-1">{exercise.muscleGroup.name}</p>
            )}
          </div>
        </div>

        {/* Exercise History */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Exercise History</h2>
          
          {exerciseHistory.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No performance history</h3>
              <p className="text-gray-600">
                This exercise hasn&apos;t been performed in any sessions yet. Start a workout to see your performance data here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exerciseHistory.map((historyEntry) => (
                <ExerciseHistoryCard
                  key={historyEntry.id}
                  historyEntry={historyEntry}
                  exerciseId={id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}