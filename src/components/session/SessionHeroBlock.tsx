import { CircularGauge } from '@/components/ui/CircularGauge';
import { getDevotionGlowClass } from '@/lib/utils/devotionUtils';

interface SessionHeroBlockProps {
  sessionNumber: number;
  date: Date;
  workoutTitle: string | null;
  devotionScore: number | null;
  duration: number | null; // Duration in seconds
  completedExercises: number;
  totalExercises: number;
  className?: string;
}

export function SessionHeroBlock({
  sessionNumber,
  date,
  workoutTitle,
  devotionScore,
  duration,
  completedExercises,
  totalExercises,
  className = ''
}: SessionHeroBlockProps) {
  // Format duration to rounded minutes with "min" suffix
  const formatDurationToMinutes = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  // Format date as "Wed, August 20"
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric'
    });
  };

  const glowClass = getDevotionGlowClass(devotionScore);
  const baseClasses = 'bg-white rounded-2xl p-6 shadow-sm border border-gray-100';
  const containerClasses = glowClass ? `${baseClasses} ${glowClass}` : baseClasses;

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* Chapter Title */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Chapter {sessionNumber} of your journey
        </h1>
      </div>

      {/* Devotion Score */}
      <div className="flex justify-center mb-6">
        {devotionScore ? (
          <CircularGauge 
            score={devotionScore}
            size={100}
            strokeWidth={8}
            fontSize={28}
          />
        ) : (
          <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-gray-200">
            <span className="text-xl font-bold text-gray-400">-</span>
          </div>
        )}
      </div>

      {/* Session Meta */}
      <div className="text-center mb-4">
        <p className="text-lg font-medium text-gray-900">
          {formatDate(date)} • {workoutTitle || 'Custom Workout'}
        </p>
      </div>

      {/* Stats Line */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {duration && (
            <>
              Duration: {formatDurationToMinutes(duration)} • {' '}
            </>
          )}
          {completedExercises} of {totalExercises} exercises
        </p>
      </div>
    </div>
  );
}