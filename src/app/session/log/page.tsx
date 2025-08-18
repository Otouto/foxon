import Link from 'next/link';
import { ArrowLeft, Check, Plus } from 'lucide-react';

export default function LogSessionPage() {
  return (
    <div className="px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/session/start" className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Push Day</h1>
            <p className="text-sm text-gray-500">Exercise 1 of 5</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">12:34</div>
      </div>

      {/* Current Exercise */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bench Press</h2>
        
        {/* Sets */}
        <div className="space-y-3">
          {/* Set 1 - Completed */}
          <div className="flex items-center gap-4 p-3 bg-lime-50 rounded-xl border border-lime-200">
            <div className="w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center">
              <Check size={14} className="text-black" />
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Set</p>
                <p className="font-medium">1</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Weight</p>
                <p className="font-medium">80kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reps</p>
                <p className="font-medium">12</p>
              </div>
            </div>
          </div>

          {/* Set 2 - Current */}
          <div className="flex items-center gap-4 p-3 bg-cyan-50 rounded-xl border-2 border-cyan-400">
            <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
              2
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Set</p>
                <p className="font-medium">2</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Weight</p>
                <input 
                  type="number" 
                  defaultValue="90"
                  className="w-16 text-center font-medium bg-transparent border-b border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">Reps</p>
                <input 
                  type="number" 
                  defaultValue="10"
                  className="w-16 text-center font-medium bg-transparent border-b border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Set 3 - Planned */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
              3
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Set</p>
                <p className="font-medium text-gray-400">3</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Weight</p>
                <p className="font-medium text-gray-400">100kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reps</p>
                <p className="font-medium text-gray-400">8</p>
              </div>
            </div>
          </div>

          {/* Set 4 - Planned */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
              4
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Set</p>
                <p className="font-medium text-gray-400">4</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Weight</p>
                <p className="font-medium text-gray-400">100kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reps</p>
                <p className="font-medium text-gray-400">6</p>
              </div>
            </div>
          </div>
        </div>

        {/* Previous Session Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Previous session (Jan 10)</p>
          <p className="text-sm font-medium text-gray-700">Best: 95kg × 8 • Volume: 1,420kg</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-8">
        <button className="flex-1 bg-cyan-400 text-white font-semibold py-3 rounded-xl">
          Complete Set
        </button>
        <button className="px-4 py-3 bg-gray-100 rounded-xl">
          <Plus size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Finish Button */}
      <div className="fixed bottom-24 left-6 right-6">
        <Link href="/session/finish" className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block">
          Finish Workout
        </Link>
      </div>
    </div>
  );
}
