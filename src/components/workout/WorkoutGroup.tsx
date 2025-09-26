'use client';

import { useState, useEffect } from 'react';
import { WorkoutGroup as WorkoutGroupType } from '@/lib/types/workout';
import { WorkoutCard } from './WorkoutCard';
import { WorkoutGroupHeader } from './WorkoutGroupHeader';

interface WorkoutGroupProps {
  group: WorkoutGroupType;
  defaultExpanded?: boolean;
}

const STORAGE_KEY = 'workoutGroupsCollapsed';

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

export function WorkoutGroup({ group, defaultExpanded = false }: WorkoutGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const storedState = getStoredCollapsedState();
    const expanded = storedState[group.key] !== undefined ? !storedState[group.key] : defaultExpanded;
    setIsExpanded(expanded);
  }, [group.key, defaultExpanded]);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    const storedState = getStoredCollapsedState();
    storedState[group.key] = !newExpanded;
    setStoredCollapsedState(storedState);
  };

  return (
    <div className="space-y-0">
      <WorkoutGroupHeader
        title={group.title}
        count={group.count}
        isExpanded={isExpanded}
        onToggle={handleToggle}
      />

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {isExpanded && (
          <div className="space-y-4 pt-2">
            {group.workouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}