'use client';

interface BackgroundSaveState {
  status: 'idle' | 'saving' | 'completed' | 'error';
  sessionId?: string;
  error?: string;
}

interface BackgroundSaveIndicatorProps {
  saveState: BackgroundSaveState;
  className?: string;
}

/**
 * Component to display the background save status with appropriate styling and messaging
 */
export function BackgroundSaveIndicator({ 
  saveState, 
  className = "" 
}: BackgroundSaveIndicatorProps) {
  if (saveState.status === 'idle' || saveState.status === 'completed') {
    return null;
  }

  if (saveState.status === 'saving') {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-2xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-700 text-sm">Saving your session in the background...</p>
        </div>
      </div>
    );
  }

  if (saveState.status === 'error') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-2xl p-4 ${className}`}>
        <p className="text-red-700 text-sm">
          Error saving session: {saveState.error}. Please try again.
        </p>
      </div>
    );
  }

  return null;
}
