'use client';

import { useSessionReflection, type ReflectionFormData } from '@/hooks/useSessionReflection';
import { SessionErrorBoundary } from './SessionErrorBoundary';
import PillarRPEPicker from '@/components/ui/PillarRPEPicker';

interface SessionReflectionFormProps {
  onSubmit: (data: ReflectionFormData) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

/**
 * Form component for session reflection (effort, vibe line, notes)
 * Handles all form UI and validation using the useSessionReflection hook
 */
function SessionReflectionFormContent({ 
  onSubmit, 
  disabled = false, 
  className = "" 
}: SessionReflectionFormProps) {
  const reflection = useSessionReflection({ onSubmit });

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">How was your session?</h3>
      
      {/* Effort Rating - Following spacing rhythm: title → 24pt → description → 32pt → pillars → 16pt → chip → 24pt → next field */}
      <div style={{ marginBottom: '24pt' }}>
        <label className="block text-sm font-medium text-gray-700" style={{ marginBottom: '24pt' }}>
          Rate Your Effort
        </label>
        <PillarRPEPicker
          value={reflection.rpeValue}
          onChange={reflection.handleRpeChange}
          disabled={disabled || reflection.isSubmitting}
          className="w-full"
        />
      </div>

      {/* One-line Vibe */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          One-line vibe <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g., Crushed those bench sets!"
          value={reflection.vibeLine}
          onChange={(e) => reflection.setVibeLine(e.target.value)}
          disabled={disabled || reflection.isSubmitting}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          maxLength={200}
        />
      </div>


      {/* Submit Button - Fixed at bottom */}
      <div className="fixed bottom-24 left-6 right-6">
        <button 
          onClick={reflection.handleSubmit}
          disabled={disabled || reflection.isSubmitting || !reflection.isValid}
          className="w-full bg-lime-400 text-black font-semibold py-4 rounded-2xl text-center block disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-500 transition-colors"
        >
          {reflection.isSubmitting ? 'Saving Reflection...' : 'Done'}
        </button>
      </div>
    </div>
  );
}

export function SessionReflectionForm(props: SessionReflectionFormProps) {
  return (
    <SessionErrorBoundary
      fallback={
        <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${props.className || ''}`}>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Unable to load reflection form</p>
            <p className="text-sm text-gray-500">Please refresh the page or try again later.</p>
          </div>
        </div>
      }
    >
      <SessionReflectionFormContent {...props} />
    </SessionErrorBoundary>
  );
}
