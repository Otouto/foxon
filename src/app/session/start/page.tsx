'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, Suspense } from 'react';

function SessionStartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreatingRef = useRef(false);
  
  useEffect(() => {
    const workoutId = searchParams.get('workoutId');
    
    if (!workoutId) {
      // Redirect back to workouts if no workoutId provided
      router.push('/workout');
      return;
    }

    async function createSession() {
      // Prevent duplicate requests in React Strict Mode
      if (isCreatingRef.current) {
        console.log('Session creation already in progress, skipping duplicate request');
        return;
      }
      
      isCreatingRef.current = true;
      
      try {
        // Create a new session via API route
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ workoutId }),
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const data = await response.json();
        
        if (data.success && data.session) {
          // Redirect to the session logging page with the new session ID
          router.push(`/session/${data.session.id}/log`);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Failed to create session:', error);
        // Reset flag on error so user can retry
        isCreatingRef.current = false;
        // Redirect back to workouts on error
        router.push('/workout');
      }
    }
    
    createSession();
    
    // Cleanup function to reset flag when component unmounts
    return () => {
      isCreatingRef.current = false;
    };
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
