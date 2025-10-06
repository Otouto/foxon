'use client'

import { useState } from 'react'
import { X, HelpCircle } from 'lucide-react'
import { BottomSheet, BottomSheetTitle, BottomSheetDescription } from '@/components/ui/BottomSheet'
import type { DevotionDeviation } from '@/services/SessionService'

interface WhyScoreSheetProps {
  deviations: DevotionDeviation[]
  score: number
  className?: string
}

export function WhyScoreSheet({ deviations, score, className = "" }: WhyScoreSheetProps) {
  const [isOpen, setIsOpen] = useState(false)

  const hasDeviations = deviations && deviations.length > 0

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors ${className}`}
        disabled={!hasDeviations}
      >
        <HelpCircle size={16} />
        <span>Why this score?</span>
      </button>

      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        maxHeight="max-h-[80vh]"
        className="sm:rounded-3xl sm:max-w-md sm:mx-auto sm:relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <BottomSheetTitle className="text-xl font-bold text-gray-900">
              Why {score}/100?
            </BottomSheetTitle>
            <BottomSheetDescription className="text-sm text-gray-500 mt-1">
              Top factors affecting your devotion score
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
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {!hasDeviations ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎯</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Perfect Execution!
              </h4>
              <p className="text-gray-600">
                No significant deviations detected. You followed your workout plan closely.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deviations.slice(0, 3).map((deviation, index) => (
                <div
                  key={`${deviation.exerciseName}-${deviation.type}-${index}`}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl"
                >
                  {/* Impact Indicator */}
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        deviation.impact > 0.3 ? 'bg-red-400' :
                        deviation.impact > 0.15 ? 'bg-yellow-400' :
                        'bg-blue-400'
                      }`}
                    />
                  </div>

                  {/* Deviation Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {deviation.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        deviation.type === 'missed_sets' ? 'bg-red-100 text-red-700' :
                        deviation.type === 'rep_variance' ? 'bg-yellow-100 text-yellow-700' :
                        deviation.type === 'load_variance' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {deviation.type === 'missed_sets' ? 'Missed Sets' :
                         deviation.type === 'rep_variance' ? 'Rep Variance' :
                         deviation.type === 'load_variance' ? 'Load Variance' :
                         'Other'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(deviation.impact * 100)}% impact
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {deviations.length > 3 && (
                <div className="text-center text-sm text-gray-500 mt-4">
                  +{deviations.length - 3} more minor deviations
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-2xl transition-colors"
          >
            Got it
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
