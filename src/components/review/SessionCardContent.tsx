import { SessionReviewData } from '@/hooks/useReviewData';
import { formatDateWithWeekday, getPracticeTimeInfo, getDevotionScoreLabel } from '@/lib/utils/dateUtils';
import { CircularGauge } from '@/components/ui/CircularGauge';

interface SessionCardContentProps {
  session: SessionReviewData;
  className?: string;
}

export function SessionCardContent({ session, className = '' }: SessionCardContentProps) {
  const practiceTimeInfo = getPracticeTimeInfo(session.date);
  const devotionLabel = session.devotionScore ? getDevotionScoreLabel(session.devotionScore) : 'Practice';
  
  // Format duration to rounded minutes with "min" suffix
  const formatDurationToMinutes = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };
  
  const durationText = session.duration ? formatDurationToMinutes(session.duration) : '';

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-200 ease-in-out ${className}`}>
      {/* Header: Date with weekday + gym emoji */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">
          {formatDateWithWeekday(session.date)}
        </h3>
        <span className="text-lg">
          🏋️‍♂️
        </span>
      </div>

      {/* Workout title */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900">
          {session.workoutTitle || 'Custom Workout'}
        </h4>
      </div>

      {/* Devotion score circle and label */}
      <div className="flex flex-col items-center mb-4">
        {session.devotionScore ? (
          <>
            <div className="mb-2">
              <CircularGauge 
                score={session.devotionScore}
                size={80}
                strokeWidth={8}
                fontSize={24}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {devotionLabel}
            </span>
          </>
        ) : (
          <div className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-gray-200 mb-2">
            <span className="text-lg font-bold text-gray-400">-</span>
          </div>
        )}
      </div>

      {/* Duration and practice time */}
      <div className="flex items-center justify-center mb-4 text-sm text-gray-600">
        <span className="font-medium">{durationText}</span>
        {durationText && <span className="mx-2">•</span>}
        <span>{practiceTimeInfo.label}</span>
      </div>

      {/* Reflection text */}
      {session.vibeLine && (
        <div className="text-center">
          <p className="text-sm text-gray-600 italic">
            &ldquo;{session.vibeLine}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}