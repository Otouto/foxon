'use client';

import { ProgressionState } from '@prisma/client';

interface FoxStateCardProps {
  state: ProgressionState;
  devotionScore: number | null;
}

const FOX_STATE_STYLES = {
  SLIM: {
    label: 'SLIM',
    bgColor: 'bg-gray-200',
    size: 'w-16 h-16',
    emojiSize: 'text-[32px]',
    glow: '',
    gradient: false,
    pulse: false
  },
  FIT: {
    label: 'FIT',
    bgColor: 'bg-lime-400',
    size: 'w-20 h-20',
    emojiSize: 'text-[40px]',
    glow: 'shadow-lg shadow-lime-400/30',
    gradient: false,
    pulse: false
  },
  STRONG: {
    label: 'STRONG',
    bgColor: 'bg-gradient-to-br from-cyan-300 to-cyan-500',
    size: 'w-24 h-24',
    emojiSize: 'text-[48px]',
    glow: 'shadow-xl shadow-cyan-400/40',
    gradient: true,
    pulse: false
  },
  FIERY: {
    label: 'FIERY',
    bgColor: 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-purple-400',
    size: 'w-28 h-28',
    emojiSize: 'text-[56px]',
    glow: 'shadow-2xl shadow-cyan-400/50',
    gradient: true,
    pulse: true
  }
};

export function FoxStateCard({ state, devotionScore }: FoxStateCardProps) {
  const style = FOX_STATE_STYLES[state];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      {/* Fox Visual */}
      <div className="flex flex-col items-center mb-3">
        <div className="relative mb-2">
          {/* Animated background */}
          <div
            className={`
              ${style.size}
              ${style.bgColor}
              ${style.glow}
              ${style.pulse ? 'animate-pulse' : ''}
              rounded-full
              transition-all duration-300
            `}
          />
          {/* Static fox emoji */}
          <div className={`absolute inset-0 flex items-center justify-center ${style.emojiSize}`}>
            🦊
          </div>
        </div>
        
        {/* State Label */}
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {style.label}
        </h3>
      </div>

      {/* Devotion Score */}
      <div className="text-center">
        {devotionScore !== null ? (
          <>
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {devotionScore}
            </div>
            <div className="text-sm text-gray-600">
              devotion score
            </div>
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-gray-400 mb-1">
              --
            </div>
            <div className="text-sm text-gray-600">
              devotion score
            </div>
          </>
        )}
      </div>
    </div>
  );
}

