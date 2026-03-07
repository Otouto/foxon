'use client';

import React from 'react';

interface TrainingPulseGridProps {
  grid: boolean[][];
  totalSessions: number;
  weekStreak: number;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function TrainingPulseGrid({ grid, totalSessions, weekStreak }: TrainingPulseGridProps) {
  // Determine today's position in the grid
  const now = new Date();
  const dayIdx = (now.getDay() + 6) % 7; // Mon=0 ... Sun=6

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Training Pulse</h3>

      <div className="grid grid-cols-[auto_repeat(12,1fr)] gap-1">
        {DAY_LABELS.map((label, rowIdx) => (
          <React.Fragment key={rowIdx}>
            <div className="flex items-center justify-center pr-0.5">
              <span className="text-[10px] text-gray-400 leading-none">{label}</span>
            </div>
            {Array.from({ length: 12 }, (_, weekIdx) => {
              const trained = grid[rowIdx]?.[weekIdx] ?? false;
              const isToday = weekIdx === 11 && rowIdx === dayIdx;
              return (
                <div
                  key={weekIdx}
                  className={`aspect-square rounded-sm min-h-[14px]
                    ${trained ? 'bg-lime-400' : 'bg-gray-100'}
                    ${isToday ? 'ring-1 ring-gray-400' : ''}`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-3">
        {totalSessions} session{totalSessions !== 1 ? 's' : ''} &middot; {weekStreak} week streak
      </p>
    </div>
  );
}
