'use client'

import { useRouter } from 'next/navigation'
import { CircularGauge } from '@/components/ui/CircularGauge'
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

// Helper function to get the weakest pillar for accent styling
function getWeakestPillar(pillars: DevotionPillars): { key: keyof DevotionPillars; value: number } | null {
  const pillarEntries = Object.entries(pillars) as [keyof DevotionPillars, number][]
  if (pillarEntries.length === 0) return null
  
  // Filter out undefined LF values for bodyweight sessions
  const validPillars = pillarEntries.filter(([, value]) => value !== undefined)
  if (validPillars.length === 0) return null
  
  const initial = { key: validPillars[0][0], value: validPillars[0][1] }
  const weakest = validPillars.reduce((min, [key, value]) => 
    value < min.value ? { key, value } : min
  , initial)
  
  return weakest.value < 1 ? weakest : null
}

// Pillar display names
const PILLAR_NAMES: Record<keyof DevotionPillars, string> = {
  EC: 'Movements',
  SC: 'Sets',
  RF: 'Reps',
  LF: 'Weight'
}

export function Summary({ data, showTitle = true }: SummaryProps) {
  const router = useRouter()

  // Check if we have devotion score data
  if (isDevotionSummaryData(data)) {
    const { verdict, ctaHint } = getDevotionVerdict(data.devotionScore)
    const weakestPillar = getWeakestPillar(data.devotionPillars)
    
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col">
        {/* CSS Animations */}
        <style jsx>{`
          @keyframes slideUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            to {
              opacity: 1;
            }
          }
        `}</style>
        
        {/* Header */}
        {showTitle && (
          <div className="px-6 pt-8 pb-4">
            <h1 className="text-2xl font-bold text-[#0F172A] text-center">
              Session Complete
            </h1>
          </div>
        )}

        {/* Hero Card - Centered */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="bg-white rounded-2xl p-6 shadow-[0_6px_20px_rgba(2,6,23,0.06)] border border-[#E5E7EB] w-full max-w-sm">
            {/* Devotion Score Ring */}
            <div className="flex justify-center mb-6">
              <CircularGauge 
                score={data.devotionScore}
                size={220}
                strokeWidth={16}
              />
            </div>

            {/* Score Label */}
            <div className="text-center mb-2">
              <p className="text-xs text-[#64748B]">
                Devotion score
              </p>
            </div>

            {/* Human Verdict */}
            <div className="text-center mb-6">
              <p 
                className="text-base text-[#0F172A] font-semibold leading-relaxed"
                style={{
                  animationDelay: '150ms',
                  animation: 'fadeIn 0.4s ease-out forwards',
                  opacity: 0
                }}
              >
                {verdict}
              </p>
            </div>

            {/* Vertical Pillar List */}
            <div className="space-y-3">
              {(Object.entries(data.devotionPillars) as [keyof DevotionPillars, number][]).map(([key, value], index) => {
                const isWeakest = weakestPillar?.key === key
                const isWarn = isWeakest && value >= 0.6 && value < 0.75
                const isAlert = isWeakest && value < 0.6
                
                return (
                  <div 
                    key={key}
                    className={`
                      flex items-center justify-between h-11 px-4 rounded-xl border border-[#E5E7EB] bg-white
                      ${isWeakest ? 'border-l-4' : ''}
                      ${isWarn ? 'border-l-[#F59E0B]' : ''}
                      ${isAlert ? 'border-l-[#EF4444]' : ''}
                    `}
                    style={{
                      animationDelay: `${150 + (index * 20)}ms`,
                      animation: 'slideUp 0.4s ease-out forwards',
                      opacity: 0,
                      transform: 'translateY(20px)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon placeholder - you can add actual icons later */}
                      <div className="w-4 h-4 rounded-full bg-gray-200" />
                      <span className={`text-sm font-medium ${
                        isWeakest && (isWarn || isAlert) 
                          ? isWarn ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                          : 'text-[#0F172A]'
                      }`}>
                        {PILLAR_NAMES[key]}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${
                      isWeakest && (isWarn || isAlert)
                        ? isWarn ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                        : 'text-[#64748B]'
                    }`}>
                      {Math.round(value * 100)}%
                    </span>
                  </div>
                )
              })}
            </div>

            {/* CTA Hint */}
            {ctaHint && (
              <div className="text-center mt-4">
                <p className="text-sm text-[#64748B] italic">
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
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col">
      {/* Header */}
      {showTitle && (
        <div className="px-6 pt-8 pb-4">
          <h1 className="text-2xl font-bold text-[#0F172A] text-center">
            Session Complete
          </h1>
        </div>
      )}

      {/* Loading State */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-[0_6px_20px_rgba(2,6,23,0.06)] border border-[#E5E7EB] w-full max-w-sm">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
              Calculating Score...
            </h3>
            <p className="text-[#64748B] text-sm">
              Your devotion score is being calculated. This should only take a moment.
            </p>
            
            {/* Legacy stats as fallback */}
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm text-[#64748B]">
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