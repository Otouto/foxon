import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SessionService } from '@/services/SessionService';
import { WorkoutService } from '@/services/WorkoutService';
import { getCurrentUserId, isAuthenticated } from '@/lib/auth';
import { SessionHeroBlock } from '@/components/session/SessionHeroBlock';
import { ExercisePerformanceCard } from '@/components/session/ExercisePerformanceCard';
import { AlternativeWorkSection } from '@/components/session/AlternativeWorkSection';
import { redirect } from 'next/navigation';

export default async function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Check authentication
  if (!isAuthenticated()) {
    redirect('/');
  }

  const userId = getCurrentUserId();
  
  // Fetch session details and session count
  const [session, sessionNumber] = await Promise.all([
    SessionService.getSession(id, userId),
    SessionService.getSessionNumber(id, userId)
  ]);

  if (!session) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Session not found</h1>
        <Link href="/review" className="text-cyan-400 mt-4 block">← Back to review</Link>
      </div>
    );
  }

  // Fetch workout template if session has a workoutId
  let workoutTemplate = null;
  if (session.workoutId) {
    workoutTemplate = await WorkoutService.getWorkoutById(session.workoutId);
  }

  // Separate template exercises from alternative exercises
  const templateExerciseIds = workoutTemplate?.items.map(item => item.exercise.id) || [];
  const templateExercises = session.sessionExercises.filter(se => 
    templateExerciseIds.includes(se.exerciseId)
  );
  const alternativeExercises = session.sessionExercises.filter(se => 
    !templateExerciseIds.includes(se.exerciseId)
  );

  // Calculate completed exercises count
  const completedExercises = session.sessionExercises.filter(se => 
    se.sessionSets.some(set => set.completed)
  ).length;
  const totalExercises = session.sessionExercises.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/review" className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Session Review</h1>
        </div>

        {/* Session Hero */}
        <div className="mb-6">
          <SessionHeroBlock
            sessionNumber={sessionNumber || 1}
            date={session.date}
            workoutTitle={session.workout?.title || null}
            devotionScore={session.devotionScore}
            duration={session.duration}
            completedExercises={completedExercises}
            totalExercises={totalExercises}
          />
        </div>

        {/* Exercise Performance List */}
        {templateExercises.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-gray-900">Performance</h3>
            {templateExercises.map((sessionExercise, index) => {
              // Find matching template sets for this exercise
              const workoutItem = workoutTemplate?.items.find(
                item => item.exercise.id === sessionExercise.exerciseId
              );
              const templateSets = workoutItem?.sets.map(set => ({
                type: set.type,
                targetLoad: Number(set.targetLoad),
                targetReps: set.targetReps,
                order: set.order
              }));

              return (
                <ExercisePerformanceCard 
                  key={sessionExercise.id} 
                  sessionExercise={sessionExercise}
                  exerciseNumber={index + 1}
                  templateSets={templateSets}
                  muscleGroup={workoutItem?.exercise.muscleGroup?.name}
                />
              );
            })}
          </div>
        )}

        {/* Alternative Work Section */}
        <div className="mb-8">
          <AlternativeWorkSection alternativeExercises={alternativeExercises} />
        </div>
      </div>
    </div>
  );
}