'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { GroupSummary } from '@/lib/utils/dateUtils';

interface GroupHeaderProps {
  title: string;
  summary: GroupSummary;
  type: 'week' | 'month';
  isExpanded: boolean;
  onToggle: () => void;
}

export function GroupHeader({ title, summary, type, isExpanded, onToggle }: GroupHeaderProps) {
  const getSummaryText = () => {
    if (type === 'week') {
      const { totalSessions, plannedSessions, status } = summary;
      return `${totalSessions} of ${plannedSessions} planned • ${status}`;
    } else {
      const { totalSessions, averageDevotion } = summary;
      const devotionText = averageDevotion ? `${averageDevotion}% avg devotion` : 'No devotion data';
      return `${totalSessions} session${totalSessions !== 1 ? 's' : ''} • ${devotionText}`;
    }
  };

  const getStatusColor = () => {
    if (type === 'week' && summary.status) {
      switch (summary.status) {
        case 'On track': return 'text-green-600';
        case 'Keep going': return 'text-yellow-600';
        case 'Catch up': return 'text-red-600';
        default: return 'text-gray-600';
      }
    }
    return 'text-gray-600';
  };

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-6 h-6">
          {isExpanded ? (
            <ChevronDown size={20} className="text-gray-600" />
          ) : (
            <ChevronRight size={20} className="text-gray-600" />
          )}
        </div>
        <div className="text-left">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className={`text-sm ${getStatusColor()}`}>
            {getSummaryText()}
          </p>
        </div>
      </div>
    </button>
  );
}