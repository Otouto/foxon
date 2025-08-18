'use client';

import { useState } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'exercises'>('sessions');

  return (
    <div className="px-6 py-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Review</h1>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'sessions'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          <Calendar size={18} />
          Sessions
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'exercises'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          <TrendingUp size={18} />
          Exercises
        </button>
      </div>

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Today</h3>
              <span className="text-sm text-gray-500">Jan 15</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Push Day</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">All-In</span>
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                </div>
              </div>
              <p className="text-sm text-gray-500">"Crushed those bench sets! 💪"</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Yesterday</h3>
              <span className="text-sm text-gray-500">Jan 14</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pull Day</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Steady</span>
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                </div>
              </div>
              <p className="text-sm text-gray-500">"Good session, felt strong"</p>
            </div>
          </div>
        </div>
      )}

      {/* Exercises Tab */}
      {activeTab === 'exercises' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Bench Press</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Best Set</span>
                <span className="font-medium">100kg × 8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Volume</span>
                <span className="font-medium">2,400kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sessions</span>
                <span className="font-medium">12</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Deadlift</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Best Set</span>
                <span className="font-medium">140kg × 5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Volume</span>
                <span className="font-medium">3,200kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sessions</span>
                <span className="font-medium">8</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
