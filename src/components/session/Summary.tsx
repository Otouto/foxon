'use client'

import { formatDuration } from '@/lib/utils'

interface SummaryData {
  workoutTitle?: string
  duration: number
  totalVolume?: number // Temporary: will be replaced with devotion score
  totalSets?: number   // Temporary: will be replaced with devotion score
  exercises: Array<{ 
    id?: string
    name?: string
    exerciseId?: string
    exerciseName?: string
  }>
}

interface SummaryProps {
  data: SummaryData
  showTitle?: boolean
}

export function Summary({ data, showTitle = true }: SummaryProps) {
  // Helper function to get exercise count
  const getExerciseCount = () => {
    return data.exercises.length
  }

  // Helper function to get workout title
  const getWorkoutTitle = () => {
    return data.workoutTitle || 'Session'
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {showTitle && (
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {getWorkoutTitle()} Summary
        </h2>
      )}
      
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{formatDuration(data.duration)}</p>
          <p className="text-sm text-gray-500">Duration</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{data.totalVolume || 0}kg</p>
          <p className="text-sm text-gray-500">Total Volume</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{data.totalSets || 0}</p>
          <p className="text-sm text-gray-500">Total Sets</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-lime-600">{getExerciseCount()}</p>
          <p className="text-sm text-gray-500">Exercises</p>
        </div>
      </div>
    </div>
  )
}
