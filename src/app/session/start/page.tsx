'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { createMockSession } from '@/lib/seedData';

function SessionStartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const workoutId = searchParams.get('workoutId');
    
    if (!workoutId) {
      // Redirect back to workouts if no workoutId provided
      router.push('/workout');
      return;
    }

    try {
      // Create a new session for this workout
      const session = createMockSession(workoutId);
      
      // Redirect to the session logging page with the new session ID
      router.push(`/session/${session.id}/log`);
    } catch (error) {
      console.error('Failed to create session:', error);
      // Redirect back to workouts on error
      router.push('/workout');
    }
  }, [searchParams, router]);

  // Show loading state while redirecting
  return (
    <div className="px-6 py-8 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Starting your workout session...</p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="px-6 py-8 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function SessionStartPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SessionStartContent />
    </Suspense>
  );
}
