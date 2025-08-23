'use client'

import { useRouter } from 'next/navigation'
import { CircularGauge } from '@/components/ui/CircularGauge'
import { DetailsSheet } from '@/components/ui/DetailsSheet'
import { getDevotionVerdict } from '@/lib/devotionVerdicts'
import type { DevotionPillars, DevotionDeviation } from '@/services/SessionService'
import styles from './Summary.module.css'

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

// Pillar display names - renamed "Movements" to "Exercises" and fixed order
const PILLAR_NAMES: Record<keyof DevotionPillars, string> = {
  EC: 'Exercises',
  SC: 'Sets',
  RF: 'Reps',
  LF: 'Weight'
}

// Fixed order for pillar display: Exercises · Sets · Reps · Weight
const PILLAR_ORDER: (keyof DevotionPillars)[] = ['EC', 'SC', 'RF', 'LF']

export function Summary({ data, showTitle = true }: SummaryProps) {
  const router = useRouter()

  // Check if we have devotion score data
  if (isDevotionSummaryData(data)) {
    const { verdict, ctaHint } = getDevotionVerdict(data.devotionScore)
    const weakestPillar = getWeakestPillar(data.devotionPillars)
    
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col">
        
        {/* Header */}
        {showTitle && (
          <div className="px-4 pt-8 pb-2">
            <h1 className="text-2xl font-bold text-[#0F172A] text-center">
              Session Complete
            </h1>
          </div>
        )}

        {/* Hero Card - Centered with precise spacing */}
        <div className="flex-1 flex items-center justify-center px-4 pt-2 pb-8">
          <div className="bg-white rounded-2xl p-[22px] shadow-[0_6px_20px_rgba(2,6,23,0.06)] border border-[#E9EDF2] w-full max-w-[380px]">
            {/* Devotion Score Ring */}
            <div className={styles.ringContainer}>
              <CircularGauge 
                score={data.devotionScore}
                size={230}
                strokeWidth={16}
                className={styles.devotionRing}
              />
            </div>

            {/* Score Label */}
            <div className="text-center mb-1.5">
              <p className="text-xs font-medium text-[#6B7280]">
                Devotion score
              </p>
            </div>

            {/* Human Verdict */}
            <div className="text-center mb-4">
              <p className={`text-base font-semibold text-[#0F172A] leading-[22px] ${styles.fadeIn} ${styles.verdict}`}>
                {verdict}
              </p>
            </div>

            {/* Vertical Pillar List - Fixed order and precise spacing */}
            <div className="space-y-2">
              {PILLAR_ORDER.map((key) => {
                const value = data.devotionPillars[key]
                if (value === undefined) return null // Skip undefined weight for bodyweight sessions
                
                const isWeakest = weakestPillar?.key === key
                const isWarn = isWeakest && value >= 0.6 && value < 0.75
                const isAlert = isWeakest && value < 0.6
                
                return (
                  <div 
                    key={key}
                    className={`
                      flex items-center justify-between h-14 px-[14px] rounded-[14px] border border-[#E9EDF2] bg-white
                      ${styles.slideUp} ${styles.pillarItem}
                      ${isWeakest && isWarn ? styles.pillarWarn : ''}
                      ${isWeakest && isAlert ? styles.pillarAlert : ''}
                    `}
                  >
                    {/* Remove the absolutely positioned accent bar */}
                    
                    <div className="flex items-center gap-3">
                      {/* Icon placeholder - 12px neutral circle */}
                      <div className="w-3 h-3 rounded-full bg-gray-200" />
                      <span className={`text-[15px] font-medium ${
                        isWeakest && (isWarn || isAlert) 
                          ? isWarn ? styles.textWarn : styles.textAlert
                          : 'text-[#334155]'
                      }`}>
                        {PILLAR_NAMES[key]}
                      </span>
                    </div>
                    <span className={`text-[15px] font-semibold font-mono ${
                      isWeakest && (isWarn || isAlert)
                        ? isWarn ? styles.textWarn : styles.textAlert
                        : 'text-[#334155]'
                    }`}>
                      {Math.round(value * 100)}%
                    </span>
                  </div>
                )
              })}
            </div>

            {/* CTA Hint */}
            {ctaHint && (
              <div className="text-center mt-2.5">
                <p className="text-sm text-[#6B7280] italic">
                  {ctaHint}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer - Sticky with safe area */}
        <div className="px-4 pb-8 pb-safe">
          <div className="flex flex-col gap-3 max-w-[380px] mx-auto">
            {/* Primary: Done - 56px height, 14px radius */}
            <button
              onClick={() => router.push('/')}
              className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold h-14 rounded-[14px] transition-colors"
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
        <div className="px-4 pt-8 pb-2">
          <h1 className="text-2xl font-bold text-[#0F172A] text-center">
            Session Complete
          </h1>
        </div>
      )}

      {/* Loading State */}
      <div className="flex-1 flex items-center justify-center px-4 pt-2 pb-8">
        <div className="bg-white rounded-2xl p-[22px] shadow-[0_6px_20px_rgba(2,6,23,0.06)] border border-[#E9EDF2] w-full max-w-[380px]">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
              Calculating Score...
            </h3>
            <p className="text-[#6B7280] text-sm">
              Your devotion score is being calculated. This should only take a moment.
            </p>
            
            {/* Legacy stats as fallback */}
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm text-[#6B7280]">
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