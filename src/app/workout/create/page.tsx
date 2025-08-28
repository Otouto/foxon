import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';

export default function CreateWorkoutPage() {
  return (
    <div className="px-6 py-8 pb-above-nav">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/workout" className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Workout</h1>
      </div>

      {/* Workout Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Workout Name
        </label>
        <input
          type="text"
          placeholder="e.g., Push Day"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
        />
      </div>

      {/* Add Exercises */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Exercises</h2>
          <button className="bg-cyan-400 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <Plus size={16} />
            Add Exercise
          </button>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💪</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">No exercises yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Tap the cyan + button to add exercises to your workout
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-above-nav left-6 right-6">
        <button className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl">
          Save Workout
        </button>
      </div>
    </div>
  );
}
