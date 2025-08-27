'use client'

import { useEffect, useState } from 'react'
import styles from './CircularGauge.module.css'

interface CircularGaugeProps {
  score: number // 0-100
  size?: number
  strokeWidth?: number
  fontSize?: number
  className?: string
}

interface ScoreVisualProps {
  opacity: number
  shouldPulse: boolean
}

// Calculate visual properties based on score for devotion hierarchy
function getScoreVisualProps(score: number): ScoreVisualProps {
  if (score >= 90) {
    return { opacity: 1, shouldPulse: true }
  }
  
  // For scores 80 and below: opacity decreases by 20% for every 10 points drop
  if (score <= 80) {
    // 80 -> 0.8, 70 -> 0.6, 60 -> 0.4, 50 -> 0.2, etc.
    const opacity = Math.max(0.2, score / 100)
    return { opacity, shouldPulse: false }
  }
  
  // Scores 81-89: full opacity, no pulse
  return { opacity: 1, shouldPulse: false }
}

export function CircularGauge({ 
  score, 
  size = 200, 
  strokeWidth = 12,
  fontSize,
  className = "" 
}: CircularGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const visualProps = getScoreVisualProps(score)
  
  // Animate the score from 0 to target
  useEffect(() => {
    const duration = 600 // 600ms as specified
    const startTime = Date.now()
    const startScore = 0
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease-out animation
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const currentScore = startScore + (score - startScore) * easeProgress
      
      setAnimatedScore(currentScore)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }, [score])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  // Calculate stroke dash offset for progress (starts at top, goes clockwise)
  const progress = Math.max(0, Math.min(100, animatedScore)) / 100
  const strokeDashoffset = circumference - (progress * circumference)

  return (
    <div 
      className={`relative flex flex-col items-center ${styles.gaugeContainer} ${className}`}
      style={{ opacity: visualProps.opacity, width: size, height: size }}
    >
      {/* Ring Layer - can pulse independently */}
      <div 
        className={`absolute inset-0 ${visualProps.shouldPulse ? styles.devotionPulse : ''}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90" // Start from top (-90°)
        >
          {/* Define the gradient */}
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" /> {/* lavender */}
              <stop offset="100%" stopColor="#06B6D4" /> {/* cyan */}
            </linearGradient>
          </defs>
          
          {/* Background circle - track color #E9EDF2 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            stroke="#E9EDF2"
            strokeLinecap="round"
          />
          
          {/* Progress circle with gradient */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            stroke="url(#ring-gradient)"
            style={{
              transformOrigin: `${center}px ${center}px`,
            }}
          />
        </svg>
      </div>

      {/* Score Text Layer - completely independent, always stable */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ width: size, height: size }}
      >
        <div 
          className="font-bold text-[#0F172A]"
          style={{
            fontSize: fontSize ? `${fontSize}px` : '52px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            lineHeight: 1
          }}
        >
          {Math.round(animatedScore)}
        </div>
      </div>
    </div>
  )
}
