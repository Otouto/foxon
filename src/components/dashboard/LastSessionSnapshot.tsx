'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getDaysAgoLabel } from '@/lib/utils/dateUtils';
import { DashboardCache } from '@/lib/dashboardCache';

interface LastSessionSnapshotProps {
  session: {
    id: string;
    workoutTitle: string;
    date: string;
    devotionScore: number | null;
    vibeLine: string | null;
  };
}

export function LastSessionSnapshot({ session }: LastSessionSnapshotProps) {
  const sessionDate = new Date(session.date);

  const cachedId = useMemo(() => DashboardCache.getLastSessionId(), []);
  const isNewSession = cachedId !== null && cachedId !== session.id;
  const [shouldAnimate] = useState(isNewSession);

  useEffect(() => {
    DashboardCache.setLastSessionId(session.id);
  }, [session.id]);

  return (
    <Link href="/review" className="block">
      <div
        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        style={shouldAnimate ? {
          animation: 'fadeSlideUp 500ms ease-out 1200ms both',
        } : undefined}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Last Session</span>
          <span className="text-xs text-gray-400">{getDaysAgoLabel(sessionDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="font-medium text-gray-900 truncate">{session.workoutTitle}</h3>
            {session.vibeLine && (
              <p className="text-sm text-gray-500 italic truncate mt-0.5">
                &ldquo;{session.vibeLine}&rdquo;
              </p>
            )}
          </div>
          {session.devotionScore !== null && (
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">{session.devotionScore}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
