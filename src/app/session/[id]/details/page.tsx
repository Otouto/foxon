import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SessionService } from '@/services/SessionService';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';
import { SessionCardContent } from '@/components/review/SessionCardContent';
import { ExercisePerformanceCard } from '@/components/session/ExercisePerformanceCard';
import { redirect } from 'next/navigation';

export default async function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Check authentication
  if (!isAuthenticated()) {
    redirect('/');
  }

  const userId = getCurrentUserId();
  
  // Fetch session details
  const session = await SessionService.getSession(id, userId);

  if (!session) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Session not found</h1>
        <Link href="/review" className="text-cyan-400 mt-4 block">← Back to review</Link>
      </div>
    );
  }

  // Convert session to SessionReviewData format for SessionCardContent
  const sessionReviewData = {
    id: session.id,
    date: session.date,
    workoutTitle: session.workout?.title || null,
    status: session.status,
    devotionScore: session.devotionScore,
    devotionGrade: session.devotionGrade,
    vibeLine: undefined, // TODO: Add vibeLine from sessionSeal when available
    duration: undefined, // TODO: Add duration calculation
  };

  return (
    <div className="px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/review" className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
      </div>

      {/* Session Card */}
      <div className="mb-6">
        <SessionCardContent session={sessionReviewData} />
      </div>

      {/* Exercise Performance List */}
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-gray-900">Performance</h3>
        {session.sessionExercises.map((sessionExercise, index) => (
          <ExercisePerformanceCard 
            key={sessionExercise.id} 
            sessionExercise={sessionExercise}
            exerciseNumber={index + 1}
          />
        ))}
      </div>
    </div>
  );
}