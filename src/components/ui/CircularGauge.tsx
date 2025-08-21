'use client'

import { useMemo } from 'react'
import { getRingColor } from '@/lib/devotionVerdicts'

interface CircularGaugeProps {
  score: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
}

export function CircularGauge({ 
  score, 
  size = 200, 
  strokeWidth = 12,
  className = "" 
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  // Calculate stroke dash offset for progress (starts at top, goes clockwise)
  const progress = Math.max(0, Math.min(100, score)) / 100
  const strokeDashoffset = circumference - (progress * circumference)

  // Score-based colors
  const ringColors = useMemo(() => getRingColor(score), [score])

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* SVG Gauge */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90" // Start from top
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={ringColors.background}
          />
          
          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${ringColors.primary} transition-all duration-1000 ease-out`}
            style={{
              transformOrigin: `${center}px ${center}px`,
            }}
          />
        </svg>

        {/* Score Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-gray-900">
            {Math.round(score)}
          </div>
          <div className="text-sm text-gray-500">
            out of 100
          </div>
        </div>
      </div>
    </div>
  )
}
