'use client';

import { useState, useEffect } from 'react';
import { SessionGroup as SessionGroupType } from '@/lib/utils/dateUtils';
import { SessionReviewData } from '@/hooks/useReviewData';
import { SessionCard } from './SessionCard';
import { GroupHeader } from './GroupHeader';
import { ProportionalConnector } from './ProportionalConnector';
import { getSessionConnections } from '@/lib/utils/sessionPatterns';

interface SessionGroupProps {
  group: SessionGroupType<SessionReviewData>;
  onDeleteSession: (sessionId: string) => Promise<boolean>;
}

const STORAGE_KEY = 'sessionGroupsCollapsed';

function getStoredCollapsedState(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setStoredCollapsedState(state: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage errors
  }
}

export function SessionGroup({ group, onDeleteSession }: SessionGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const storedState = getStoredCollapsedState();
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const currentMonthKey = currentMonth.toLowerCase().replace(' ', '-');
    
    const defaultExpanded = group.key === 'this-week' || group.key === currentMonthKey;
    const expanded = storedState[group.key] !== undefined ? !storedState[group.key] : defaultExpanded;
    setIsExpanded(expanded);
  }, [group.key]);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    const storedState = getStoredCollapsedState();
    storedState[group.key] = !newExpanded;
    setStoredCollapsedState(storedState);
  };

  return (
    <div className="space-y-0">
      <GroupHeader
        title={group.title}
        summary={group.summary}
        type={group.type}
        isExpanded={isExpanded}
        onToggle={handleToggle}
      />
      
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {isExpanded && (
          <div className="space-y-0">
            {(() => {
              // Get session connections for pattern analysis
              const connections = getSessionConnections(group.sessions);
              const sortedSessions = [...group.sessions].sort((a, b) => b.date.getTime() - a.date.getTime());
              
              return sortedSessions.map((session: SessionReviewData, index: number) => {
                // Find the corresponding connection (connections are in chronological order, sessions are reverse-chronological)
                const connectionIndex = sortedSessions.length - index - 2; // -2 because connections array is 1 less than sessions
                const connection = connections[connectionIndex];
                
                return (
                  <div key={session.id}>
                    <SessionCard
                      session={session}
                      onDelete={onDeleteSession}
                    />
                    {/* Show connector after this session if there's a connection */}
                    {connection && (
                      <ProportionalConnector connection={connection} />
                    )}
                    {/* Add spacing after sessions without connectors */}
                    {!connection && index < sortedSessions.length - 1 && (
                      <div className="h-4" />
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}