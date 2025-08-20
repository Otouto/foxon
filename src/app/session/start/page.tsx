'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useWorkoutPreload } from '@/hooks/useWorkoutPreload';

function SessionStartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getPreloadedWorkout } = useWorkoutPreload();
  
  useEffect(() => {
    const workoutId = searchParams.get('workoutId');
    
    if (!workoutId) {
      // Redirect back to workouts if no workoutId provided
      router.push('/workout');
      return;
    }

    // Check if we have preloaded data
    const preloadedData = getPreloadedWorkout(workoutId);
    
    if (preloadedData) {
      // Instant redirect with preloaded data - no API calls needed!
      router.push(`/session/log?workoutId=${workoutId}&preloaded=true`);
    } else {
      // Fallback: redirect to log page, it will handle loading
      router.push(`/session/log?workoutId=${workoutId}&preloaded=false`);
    }
  }, [searchParams, router, getPreloadedWorkout]);

  // Show minimal loading state while redirecting
  return (
    <div className="px-6 py-8 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Starting your workout...</p>
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
