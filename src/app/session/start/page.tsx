import Link from 'next/link';
import { ArrowLeft, Play, Clock } from 'lucide-react';

export default function StartSessionPage() {
  return (
    <div className="px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/workout" className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Start Workout</h1>
      </div>

      {/* Session Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Push Day</h2>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>~45 min</span>
          </div>
          <span>5 exercises</span>
        </div>
      </div>

      {/* Exercise Preview */}
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-gray-900">Today&apos;s Exercises</h3>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Bench Press</h4>
              <p className="text-sm text-gray-500">4 sets • Last: 100kg × 8</p>
            </div>
            <div className="text-sm text-gray-400">1</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Incline Dumbbell Press</h4>
              <p className="text-sm text-gray-500">3 sets • Last: 35kg × 10</p>
            </div>
            <div className="text-sm text-gray-400">2</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Shoulder Press</h4>
              <p className="text-sm text-gray-500">3 sets • Last: 25kg × 12</p>
            </div>
            <div className="text-sm text-gray-400">3</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Tricep Dips</h4>
              <p className="text-sm text-gray-500">3 sets • Last: Bodyweight × 15</p>
            </div>
            <div className="text-sm text-gray-400">4</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900">Push-ups</h4>
              <p className="text-sm text-gray-500">2 sets • Last: Bodyweight × 20</p>
            </div>
            <div className="text-sm text-gray-400">5</div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="fixed bottom-24 left-6 right-6">
        <Link href="/session/log" className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl flex items-center justify-center gap-3">
          <Play size={20} />
          Start Workout
        </Link>
      </div>
    </div>
  );
}
