import { SessionReviewData } from '@/hooks/useReviewData';
import { formatDate, formatDateShort } from '@/lib/utils/dateUtils';
import { EffortIndicator } from './EffortIndicator';

interface SessionCardContentProps {
  session: SessionReviewData;
  className?: string;
}

export function SessionCardContent({ session, className = '' }: SessionCardContentProps) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{formatDate(session.date)}</h3>
        <span className="text-sm text-gray-500">{formatDateShort(session.date)}</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{session.workoutTitle || 'Custom Workout'}</span>
          {session.effort && <EffortIndicator effort={session.effort} />}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{session.devotionScore ? `${session.devotionScore}/100` : 'No score'}</span>
          <span>{session.devotionGrade || 'Not graded'}</span>
        </div>
        
        {session.vibeLine && (
          <p className="text-sm text-gray-500">&ldquo;{session.vibeLine}&rdquo;</p>
        )}
      </div>
    </div>
  );
}