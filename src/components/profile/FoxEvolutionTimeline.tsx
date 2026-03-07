import { ProgressionState } from '@prisma/client';

interface FoxEvolutionTimelineProps {
  currentState: ProgressionState;
}

const STATES: ProgressionState[] = ['SLIM', 'FIT', 'STRONG', 'FIERY'];

const STATE_CONFIG = {
  SLIM: { label: 'Slim', emoji: '🦊' },
  FIT: { label: 'Fit', emoji: '🦊' },
  STRONG: { label: 'Strong', emoji: '💪' },
  FIERY: { label: 'Fiery', emoji: '🔥' },
};

function isAtOrPast(current: ProgressionState, target: ProgressionState): boolean {
  return STATES.indexOf(current) >= STATES.indexOf(target);
}

export function FoxEvolutionTimeline({ currentState }: FoxEvolutionTimelineProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Fox Evolution</h3>
      <div className="flex items-center justify-between">
        {STATES.map((state, i) => {
          const config = STATE_CONFIG[state];
          const isCurrent = state === currentState;
          const isPast = isAtOrPast(currentState, state) && !isCurrent;
          const isFuture = !isAtOrPast(currentState, state);

          return (
            <div key={state} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-lg
                    ${isCurrent ? 'bg-lime-400 ring-2 ring-lime-500 ring-offset-2' : ''}
                    ${isPast ? 'bg-lime-100' : ''}
                    ${isFuture ? 'bg-gray-100' : ''}
                  `}
                >
                  <span className={isFuture ? 'opacity-30' : ''}>{config.emoji}</span>
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium
                    ${isCurrent ? 'text-gray-900' : ''}
                    ${isPast ? 'text-gray-400' : ''}
                    ${isFuture ? 'text-gray-300' : ''}
                  `}
                >
                  {config.label}
                </span>
              </div>
              {i < STATES.length - 1 && (
                <div
                  className={`w-6 h-0.5 mx-1 mb-5 ${
                    isAtOrPast(currentState, STATES[i + 1]) ? 'bg-lime-300' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
