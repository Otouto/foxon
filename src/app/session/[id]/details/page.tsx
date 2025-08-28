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

  // Separate alternative exercises from template exercises
  const templateExerciseIds = workoutTemplate?.items.map(item => item.exercise.id) || [];
  const alternativeExercises = session.sessionExercises.filter(se => 
    !templateExerciseIds.includes(se.exerciseId)
  );

  // Calculate completed template exercises count
  const completedTemplateExercises = session.sessionExercises.filter(se => 
    templateExerciseIds.includes(se.exerciseId) && se.sessionSets.some(set => set.completed)
  ).length;
  const totalTemplateExercises = workoutTemplate?.items.length || 0;

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
            completedExercises={completedTemplateExercises}
            totalExercises={totalTemplateExercises}
          />
        </div>

        {/* Exercise Performance List */}
        {workoutTemplate && workoutTemplate.items.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-gray-900">Performance</h3>
            {workoutTemplate.items.map((workoutItem, index) => {
              // Find corresponding session exercise if it exists
              const sessionExercise = session.sessionExercises.find(
                se => se.exerciseId === workoutItem.exercise.id
              );
              
              const templateSets = workoutItem.sets.map(set => ({
                type: set.type,
                targetLoad: Number(set.targetLoad),
                targetReps: set.targetReps,
                order: set.order
              }));

              // Create a mock sessionExercise structure for skipped exercises
              const displaySessionExercise = sessionExercise || {
                id: `mock-${workoutItem.exercise.id}`,
                sessionId: session.id,
                exerciseId: workoutItem.exercise.id,
                order: workoutItem.order,
                notes: null,
                exercise: workoutItem.exercise,
                sessionSets: []
              };

              return (
                <ExercisePerformanceCard 
                  key={displaySessionExercise.id} 
                  sessionExercise={displaySessionExercise}
                  exerciseNumber={index + 1}
                  templateSets={templateSets}
                  muscleGroup={workoutItem.exercise.muscleGroup?.name}
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