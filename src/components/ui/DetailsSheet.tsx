'use client'

import { useState } from 'react'
import { X, CheckSquare, Layers, Target } from 'lucide-react'
import { BottomSheet, BottomSheetTitle, BottomSheetDescription } from '@/components/ui/BottomSheet'
import type { DevotionPillars, DevotionDeviation } from '@/services/SessionService'

interface DetailsSheetProps {
  pillars: DevotionPillars
  deviations: DevotionDeviation[]
  score: number
  className?: string
}

const conceptExplanations = [
  {
    icon: CheckSquare,
    title: 'Exercises',
    description: 'Coverage of planned exercises - did you do all the exercises?'
  },
  {
    icon: Layers,
    title: 'Sets',
    description: 'Completion of planned sets - how much work did you actually do?'
  },
  {
    icon: Target,
    title: 'Reps',
    description: 'Closeness to target reps - did you hit your rep targets?'
  }
]

export function DetailsSheet({ pillars, deviations, score, className = "" }: DetailsSheetProps) {
  const [isOpen, setIsOpen] = useState(false)

  const visibleConcepts = conceptExplanations

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`text-sm text-gray-600 hover:text-gray-800 transition-colors underline ${className}`}
      >
        Details
      </button>

      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="sm:rounded-3xl sm:max-w-lg sm:mx-auto sm:relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <BottomSheetTitle className="text-xl font-bold text-gray-900">
              How we scored this session
            </BottomSheetTitle>
            <BottomSheetDescription className="text-sm text-gray-500 mt-1">
              Technical breakdown of your {score}/100
            </BottomSheetDescription>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Section 1: Concepts Legend */}
          <div className="p-6 border-b border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              What we measure
            </h4>
            <div className="space-y-3">
              {visibleConcepts.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                    <Icon size={16} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900">
                      {title}
                    </h5>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {description}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {title === 'Exercises' && `${Math.round((pillars.EC || 0) * 100)}%`}
                    {title === 'Sets' && `${Math.round((pillars.SC || 0) * 100)}%`}
                    {title === 'Reps' && `${Math.round((pillars.RF || 0) * 100)}%`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Deviations (if any) */}
          {deviations && deviations.length > 0 && (
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Key deviations
              </h4>
              <div className="space-y-3">
                {deviations.slice(0, 5).map((deviation, index) => (
                  <div
                    key={`${deviation.exerciseName}-${deviation.type}-${index}`}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    {/* Impact Indicator */}
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          deviation.impact > 0.3 ? 'bg-red-400' :
                          deviation.impact > 0.15 ? 'bg-amber-400' :
                          'bg-blue-400'
                        }`}
                      />
                    </div>

                    {/* Deviation Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {deviation.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          deviation.type === 'missed_sets' ? 'bg-red-100 text-red-700' :
                          deviation.type === 'rep_variance' ? 'bg-amber-100 text-amber-700' :
                          deviation.type === 'load_variance' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {deviation.type === 'missed_sets' ? 'Sets' :
                           deviation.type === 'rep_variance' ? 'Reps' :
                           deviation.type === 'load_variance' ? 'Weight' :
                           'Other'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(deviation.impact * 100)}% impact
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No deviations state */}
          {(!deviations || deviations.length === 0) && (
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Clean execution
              </h4>
              <p className="text-sm text-gray-600">
                No significant deviations from your planned workout.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-2xl transition-colors"
          >
            Close
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
