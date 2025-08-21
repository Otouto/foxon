'use client'

import { useRouter } from 'next/navigation'
import { CircularGauge } from '@/components/ui/CircularGauge'
import { TruthChips } from '@/components/ui/TruthChips'
import { DetailsSheet } from '@/components/ui/DetailsSheet'
import { getDevotionVerdict } from '@/lib/devotionVerdicts'
import type { DevotionPillars, DevotionDeviation } from '@/services/SessionService'

// New devotion-based summary data interface
interface DevotionSummaryData {
  devotionScore: number // 0-100
  devotionGrade: string // "Dialed in", "On plan", "Loose", "Off plan"
  devotionPillars: DevotionPillars
  devotionDeviations: DevotionDeviation[]
}

// Legacy summary data interface for backward compatibility during transition
interface LegacySummaryData {
  workoutTitle?: string
  duration: number
  totalVolume?: number
  totalSets?: number
  exercises: Array<{ 
    id?: string
    name?: string
    exerciseId?: string
    exerciseName?: string
  }>
}

// Combined interface to handle both old and new data during transition
type SummaryData = DevotionSummaryData | LegacySummaryData

interface SummaryProps {
  data: SummaryData
  showTitle?: boolean
}

// Type guard to check if data is devotion-based
function isDevotionSummaryData(data: SummaryData): data is DevotionSummaryData {
  return 'devotionScore' in data && 'devotionGrade' in data && 'devotionPillars' in data
}

export function Summary({ data, showTitle = true }: SummaryProps) {
  const router = useRouter()

  // Check if we have devotion score data
  if (isDevotionSummaryData(data)) {
    const { verdict, ctaHint } = getDevotionVerdict(data.devotionScore)
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        {showTitle && (
          <div className="px-6 pt-8 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 text-center">
              Session Complete
            </h1>
          </div>
        )}

        {/* Hero Card - Centered */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full max-w-sm">
            {/* Devotion Score Ring */}
            <div className="flex justify-center mb-6">
              <CircularGauge 
                score={data.devotionScore}
                size={160}
                strokeWidth={8}
              />
            </div>

            {/* Human Verdict */}
            <div className="text-center mb-6">
              <p className="text-lg text-gray-800 font-medium leading-relaxed">
                {verdict}
              </p>
            </div>

            {/* Truth Chips */}
            <TruthChips 
              pillars={data.devotionPillars}
              className="mb-6"
            />

            {/* CTA Hint */}
            {ctaHint && (
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 italic">
                  {ctaHint}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 pb-8">
          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            {/* Primary: Done */}
            <button
              onClick={() => router.push('/')}
              className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold py-4 rounded-2xl transition-colors"
            >
              Done
            </button>

            {/* Ghost: Details */}
            <div className="flex justify-center">
              <DetailsSheet 
                pillars={data.devotionPillars}
                deviations={data.devotionDeviations}
                score={data.devotionScore}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback to legacy display (should not happen in production after full migration)
  const legacyData = data as LegacySummaryData
  const getExerciseCount = () => legacyData.exercises?.length || 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      {showTitle && (
        <div className="px-6 pt-8 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            Session Complete
          </h1>
        </div>
      )}

      {/* Loading State */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full max-w-sm">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Calculating Score...
            </h3>
            <p className="text-gray-600 text-sm">
              Your devotion score is being calculated. This should only take a moment.
            </p>
            
            {/* Legacy stats as fallback */}
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm text-gray-500">
              <div>
                <div className="font-medium">{legacyData.totalSets || 0}</div>
                <div>Sets</div>
              </div>
              <div>
                <div className="font-medium">{getExerciseCount()}</div>
                <div>Exercises</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}