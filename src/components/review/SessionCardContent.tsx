import { SessionReviewData } from '@/hooks/useReviewData';
import { formatDateWithWeekday, getPracticeTimeInfo, getDevotionScoreLabel } from '@/lib/utils/dateUtils';
import { CircularGauge } from '@/components/ui/CircularGauge';

interface SessionCardContentProps {
  session: SessionReviewData;
  className?: string;
  variant?: 'detailed' | 'compact';
}

export function SessionCardContent({ session, className = '', variant = 'detailed' }: SessionCardContentProps) {
  const practiceTimeInfo = getPracticeTimeInfo(session.date);
  const devotionLabel = session.devotionScore ? getDevotionScoreLabel(session.devotionScore) : 'Practice';
  
  // Format duration to rounded minutes with "min" suffix
  const formatDurationToMinutes = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };
  
  const durationText = session.duration ? formatDurationToMinutes(session.duration) : '';
  
  // Helper function for compact date formatting  
  const getCompactDateText = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check for Today and Yesterday
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    // Check if it's within current week (same week as today)
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);
    
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);
    
    if (sessionDate >= startOfWeek && sessionDate <= endOfWeek) {
      // Within current week - show weekday name
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    // Previous week or earlier - show date format like "Aug 15"
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Truncate reflection text for compact view
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };
  
  // Compact view layout
  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-200 ease-in-out h-[72px] ${className}`}>
        <div className="flex items-center p-3 h-full">
          {/* Devotion Score Circle - Left Side */}
          <div className="flex-shrink-0 mr-4">
            {session.devotionScore ? (
              <CircularGauge 
                score={session.devotionScore}
                size={48}
                strokeWidth={4}
                fontSize={16}
              />
            ) : (
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-200">
                <span className="text-xs font-bold text-gray-400">-</span>
              </div>
            )}
          </div>

          {/* Content - Right Side */}
          <div className="flex-1 min-w-0">
            {/* First Line: Session Name + Date */}
            <div className="flex items-start justify-between mb-1">
              <h4 className="text-lg font-semibold text-gray-900 truncate pr-2" style={{ fontSize: '18px' }}>
                {session.workoutTitle || 'Custom Workout'}
              </h4>
              <span className="text-xs text-gray-600 flex-shrink-0" style={{ fontSize: '12px', color: '#666' }}>
                {getCompactDateText(session.date)}
              </span>
            </div>

            {/* Second Line: Reflection */}
            {session.vibeLine && (
              <p className="text-sm text-gray-600 italic leading-tight" style={{ fontSize: '14px' }}>
                &ldquo;{truncateText(session.vibeLine, 40)}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Detailed view layout (original)
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