'use client'

import type { DevotionPillars } from '@/services/SessionService'
import { DevotionScoringService } from '@/services/DevotionScoringService'

interface PillarIndicatorsProps {
  pillars: DevotionPillars
  className?: string
}

interface PillarData {
  key: keyof DevotionPillars
  label: string
  description: string
}

const pillarConfig: PillarData[] = [
  { key: 'EC', label: 'EC', description: 'Exercise Coverage' },
  { key: 'SC', label: 'SC', description: 'Set Completion' },
  { key: 'RF', label: 'RF', description: 'Rep Fidelity' },
  { key: 'LF', label: 'LF', description: 'Load Fidelity' }
]

export function PillarIndicators({ pillars, className = "" }: PillarIndicatorsProps) {
  // Check if this is a bodyweight session (no LF data)
  const isBodyweightSession = pillars.LF === undefined

  return (
    <div className={`flex justify-center gap-6 ${className}`}>
      {pillarConfig.map(({ key, label, description }) => {
        const score = pillars[key]
        const isHidden = key === 'LF' && isBodyweightSession
        
        // Convert score to percentage for display
        const percentage = score ? Math.round(score * 100) : 0
        const height = score ? Math.max(4, score * 32) : 4 // Min 4px, max 32px height
        
        return (
          <div
            key={key}
            className={`flex flex-col items-center ${
              isHidden ? 'opacity-30' : ''
            }`}
            title={`${description}: ${isHidden ? 'N/A (bodyweight)' : `${percentage}%`}`}
          >
            {/* Pillar Bar */}
            <div className="w-4 h-8 bg-gray-200 rounded-full flex items-end p-0.5">
              <div
                className={`w-full rounded-full transition-all duration-700 ease-out ${
                  isHidden 
                    ? 'bg-gray-300' 
                    : DevotionScoringService.getPillarColor(score || 0)
                }`}
                style={{ height: `${height}px` }}
              />
            </div>
            
            {/* Label */}
            <div className={`text-xs font-medium mt-2 ${
              isHidden ? 'text-gray-400' : 'text-gray-700'
            }`}>
              {label}
            </div>
            
            {/* Percentage (hidden for LF on bodyweight) */}
            {!isHidden && (
              <div className="text-xs text-gray-500 mt-0.5">
                {percentage}%
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
