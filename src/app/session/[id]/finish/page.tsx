'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSession, updateSession, type Session } from '@/lib/seedData';

export default function SessionFinishPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [duration, setDuration] = useState<string>('00:00');
  
  useEffect(() => {
    const sessionData = getSession(sessionId);
    if (!sessionData) {
      router.push('/workout');
      return;
    }
    
    setSession(sessionData);
    
    // Calculate session duration
    const startTime = new Date(sessionData.created_at).getTime();
    const endTime = Date.now();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    setDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    
    // Mark session as finished if not already
    if (sessionData.status === 'ACTIVE') {
      // Calculate totals
      const totalSets = sessionData.exercises.reduce((sum, ex) => sum + ex.sets.filter(set => set.completed).length, 0);
      const totalVolume = sessionData.exercises.reduce((sum, ex) => 
        sum + ex.sets.filter(set => set.completed).reduce((exSum, set) => exSum + (set.load * set.reps), 0), 0
      );
      
      updateSession(sessionId, { 
        status: 'FINISHED',
        total_sets: totalSets,
        total_volume: totalVolume
      });
    }
  }, [sessionId, router]);

  const handleSaveAndComplete = () => {
    // In a real app, this would save the session seal to the database
    router.push('/');
  };

  if (!session) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Session not found</h1>
        <Link href="/workout" className="text-cyan-400 mt-4 block">← Back to workouts</Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/session/${sessionId}/log`} className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Session Complete</h1>
      </div>

      {/* Session Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{session.workout_name} Summary</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{duration}</p>
            <p className="text-sm text-gray-500">Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{session.total_volume}kg</p>
            <p className="text-sm text-gray-500">Total Volume</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{session.total_sets}</p>
            <p className="text-sm text-gray-500">Total Sets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-lime-600">{session.exercises.length}</p>
            <p className="text-sm text-gray-500">Exercises</p>
          </div>
        </div>
      </div>

      {/* Session Seal */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How was your session?</h3>
        
        {/* Effort Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Effort Level
          </label>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Easy</span>
            <div className="flex-1 mx-4">
              <input
                type="range"
                min="1"
                max="4"
                defaultValue="3"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <span className="text-xs text-gray-500">All-In</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-sm font-medium text-lime-600">Hard</span>
          </div>
        </div>

        {/* One-line Vibe */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            One-line vibe <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Crushed those bench sets!"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
          />
        </div>

        {/* Optional Note */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional notes (optional)
          </label>
          <textarea
            placeholder="Any additional thoughts about this session..."
            rows={3}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-24 left-6 right-6">
        <button 
          onClick={handleSaveAndComplete}
          className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block"
        >
          Save & Complete
        </button>
      </div>
    </div>
  );
}
