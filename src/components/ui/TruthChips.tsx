'use client'

import { CheckSquare, Layers, Target, Dumbbell } from 'lucide-react'
import type { DevotionPillars } from '@/services/SessionService'

interface TruthChipsProps {
  pillars: DevotionPillars
  className?: string
}

interface ChipData {
  key: keyof DevotionPillars
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  getDisplayText: (score: number) => string
}

const chipConfig: ChipData[] = [
  {
    key: 'EC',
    icon: CheckSquare,
    label: 'Movements',
    getDisplayText: (score: number) => {
      const percentage = Math.round(score * 100)
      if (percentage >= 100) return 'All movements'
      if (percentage >= 80) return 'Most movements'
      return 'Missed movements'
    }
  },
  {
    key: 'SC',
    icon: Layers,
    label: 'Sets',
    getDisplayText: (score: number) => {
      const percentage = Math.round(score * 100)
      if (percentage >= 95) return 'All sets'
      if (percentage >= 80) return 'Most sets'
      return 'Missed sets'
    }
  },
  {
    key: 'RF',
    icon: Target,
    label: 'Reps',
    getDisplayText: (score: number) => {
      const percentage = Math.round(score * 100)
      if (percentage >= 90) return 'Reps on target'
      if (percentage >= 75) return 'Reps drifted a bit'
      return 'Reps off target'
    }
  },
  {
    key: 'LF',
    icon: Dumbbell,
    label: 'Weight',
    getDisplayText: (score: number) => {
      const percentage = Math.round(score * 100)
      if (percentage >= 90) return 'Weight on target'
      if (percentage >= 75) return 'Slightly light/heavy'
      return 'Weight off target'
    }
  }
]

export function TruthChips({ pillars, className = "" }: TruthChipsProps) {
  // Check if this is a bodyweight session (no LF data)
  const isBodyweightSession = pillars.LF === undefined

  return (
    <div className={`flex justify-center gap-3 ${className}`}>
      {chipConfig.map(({ key, icon: Icon, getDisplayText }) => {
        const score = pillars[key]
        const isHidden = key === 'LF' && isBodyweightSession
        
        // Skip rendering the Weight chip for bodyweight sessions
        if (isHidden) return null
        
        if (!score) return null
        
        const percentage = Math.round(score * 100)
        const displayText = getDisplayText(score)
        
        // Color based on performance
        const getChipColor = (score: number) => {
          if (score >= 0.9) return 'bg-green-50 text-green-700 border-green-200'
          if (score >= 0.8) return 'bg-lime-50 text-lime-700 border-lime-200'
          if (score >= 0.7) return 'bg-amber-50 text-amber-700 border-amber-200'
          return 'bg-red-50 text-red-700 border-red-200'
        }
        
        return (
          <div
            key={key}
            className={`flex flex-col items-center px-3 py-2 rounded-full border ${getChipColor(score)} min-w-[80px]`}
          >
            {/* Icon and Label */}
            <div className="flex items-center gap-1 mb-1">
              <Icon size={14} className="flex-shrink-0" />
              <span className="text-xs font-medium leading-none">
                {displayText}
              </span>
            </div>
            
            {/* Percentage */}
            <div className="text-[10px] text-gray-600 leading-none">
              {percentage}%
            </div>
          </div>
        )
      })}
    </div>
  )
}
