import { SessionReviewData } from '@/hooks/useReviewData';
import { CircularGauge } from '@/components/ui/CircularGauge';

interface SessionCardContentProps {
  session: SessionReviewData;
  className?: string;
}

export function SessionCardContent({ session, className = '' }: SessionCardContentProps) {
  // Helper function to get glow effect class for high-scoring sessions
  const getGlowClass = (score: number | null | undefined): string => {
    if (!score) return '';
    if (score >= 95) return 'lavender-glow-intense';
    if (score >= 90) return 'lavender-glow';
    return '';
  };
  
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
    
    // Previous week or earlier - show date format like "Wed, Aug 15"
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Truncate reflection text for compact view
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };
  
  const glowClass = getGlowClass(session.devotionScore);
  const baseClasses = 'bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-200 ease-in-out min-h-[72px]';
  const containerClasses = glowClass ? `${baseClasses} ${glowClass}` : `${baseClasses}`;
  
  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex items-start p-3 min-h-full">
        {/* Devotion Score Circle - Left Side */}
        <div className="flex-shrink-0 mr-4 mt-1">
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

          {/* Third Line: Narrative */}
          {session.narrative && (
            <p className="text-xs text-gray-500 leading-tight mt-1" style={{ fontSize: '11px' }}>
              {session.narrative}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}