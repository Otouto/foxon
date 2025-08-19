'use client';

import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FinishSessionPage() {
  const searchParams = useSearchParams();
  const workoutId = searchParams.get('workout') || '1';
  const [duration, setDuration] = useState<string>('00:00');
  
  useEffect(() => {
    // Retrieve the stored duration from session storage
    const storedDuration = sessionStorage.getItem(`workout_duration_${workoutId}`);
    if (storedDuration) {
      const seconds = parseInt(storedDuration);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      setDuration(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      
      // Clean up the stored timer data
      sessionStorage.removeItem(`workout_timer_${workoutId}`);
      sessionStorage.removeItem(`workout_duration_${workoutId}`);
    }
  }, [workoutId]);
  return (
    <div className="px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/session/log" className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Session Complete</h1>
      </div>

      {/* Session Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Push Day Summary</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{duration}</p>
            <p className="text-sm text-gray-500">Duration</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">2,340kg</p>
            <p className="text-sm text-gray-500">Total Volume</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">15</p>
            <p className="text-sm text-gray-500">Total Sets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold lime-400">2 PRs! 🎉</p>
            <p className="text-sm text-gray-500">Personal Records</p>
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
        <Link href="/" className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block">
          Save & Complete
        </Link>
      </div>
    </div>
  );
}
