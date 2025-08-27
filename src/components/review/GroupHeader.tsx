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
    if (summary.intelligentHeader) {
      return summary.intelligentHeader;
    }
    
    // Fallback to original logic if intelligent header is not available
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
      className="w-full flex items-center justify-between py-2 pl-[5px] rounded-xl hover:bg-gray-50 transition-colors"
    >
      <div className="text-left">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <p className={`text-xs ${getStatusColor()}`}>
          {getSummaryText()}
        </p>
      </div>
      <div className="flex items-center justify-center">
        {isExpanded ? (
          <ChevronDown size={16} className="text-gray-500" />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
      </div>
    </button>
  );
}