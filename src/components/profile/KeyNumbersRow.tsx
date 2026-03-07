import { MonthAwareDevotion } from '@/services/ProfileService';

interface KeyNumbersRowProps {
  totalSessions: number;
  weekStreak: number;
  devotion: MonthAwareDevotion;
}

export function KeyNumbersRow({ totalSessions, weekStreak, devotion }: KeyNumbersRowProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
          <p className="text-xs text-gray-500">Sessions</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{weekStreak}</p>
          <p className="text-xs text-gray-500">Week Streak</p>
        </div>
        <div>
          <p className={`text-2xl font-bold ${devotion.isLastMonth ? 'text-gray-400' : 'text-gray-900'}`}>
            {devotion.score !== null ? devotion.score : '\u2014'}
          </p>
          <p className="text-xs text-gray-500">
            Avg Devotion
            {devotion.isLastMonth && devotion.monthLabel && (
              <span className="text-gray-400"> ({devotion.monthLabel})</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
