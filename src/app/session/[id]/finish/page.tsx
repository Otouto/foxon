'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSessionFromAPI, finishSession, createSessionSeal } from '@/lib/sessionClient';
import type { SessionWithDetails, SessionSealData } from '@/services/SessionService';
import { EffortLevel } from '@prisma/client';

export default function SessionFinishPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [duration, setDuration] = useState<string>('00:00');
  const [isFinishing, setIsFinishing] = useState(false);
  const [effort, setEffort] = useState<EffortLevel>(EffortLevel.HARD);
  const [vibeLine, setVibeLine] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    async function loadAndFinishSession() {
      let sessionData = await getSessionFromAPI(sessionId);
      if (!sessionData) {
        router.push('/workout');
        return;
      }
      
      // If session is still active, finish it first
      if (sessionData.status === 'ACTIVE') {
        setIsFinishing(true);
        try {
          const finishedSessionData = await finishSession(sessionId);
          if (finishedSessionData) {
            sessionData = finishedSessionData;
          }
        } catch (error) {
          console.error('Failed to finish session:', error);
        } finally {
          setIsFinishing(false);
        }
      }
      
      setSession(sessionData);
    
      // Calculate session duration
      const startTime = new Date(sessionData.createdAt).getTime();
      const endTime = new Date(sessionData.updatedAt).getTime();
      const durationSeconds = Math.floor((endTime - startTime) / 1000);
      const mins = Math.floor(durationSeconds / 60);
      const secs = durationSeconds % 60;
      setDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }
    
    loadAndFinishSession();
  }, [sessionId, router]);

  const handleSaveAndComplete = async () => {
    if (!vibeLine.trim()) {
      alert('Please add a vibe line for your session');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const sealData: SessionSealData = {
        effort,
        vibeLine: vibeLine.trim(),
        note: note.trim() || undefined
      };

      const success = await createSessionSeal(sessionId, sealData);
      
      if (success) {
        router.push('/');
      } else {
        alert('Failed to save session. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save session seal:', error);
      alert('Failed to save session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFinishing) {
    return (
      <div className="px-6 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Finishing your session...</p>
        </div>
      </div>
    );
  }

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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{session.workout?.title || 'Unknown Workout'} Summary</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{duration}</p>
            <p className="text-sm text-gray-500">Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{Number(session.totalVolume)}kg</p>
            <p className="text-sm text-gray-500">Total Volume</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{session.totalSets}</p>
            <p className="text-sm text-gray-500">Total Sets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-lime-600">{session.sessionExercises.length}</p>
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
                value={Object.values(EffortLevel).indexOf(effort) + 1}
                onChange={(e) => {
                  const effortLevels = [EffortLevel.EASY, EffortLevel.STEADY, EffortLevel.HARD, EffortLevel.ALL_IN];
                  setEffort(effortLevels[parseInt(e.target.value) - 1]);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <span className="text-xs text-gray-500">All-In</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-sm font-medium text-lime-600">{effort}</span>
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
            value={vibeLine}
            onChange={(e) => setVibeLine(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
            maxLength={200}
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
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent resize-none"
            maxLength={1000}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-24 left-6 right-6">
        <button 
          onClick={handleSaveAndComplete}
          disabled={isSubmitting || !vibeLine.trim()}
          className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save & Complete'}
        </button>
      </div>
    </div>
  );
}
