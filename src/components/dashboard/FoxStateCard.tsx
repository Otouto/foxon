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
    size: 'w-20 h-20',
    emojiSize: 'text-[40px]',
    glow: '',
    gradient: false,
    pulse: false
  },
  FIT: {
    label: 'FIT',
    bgColor: 'bg-lime-400',
    size: 'w-[100px] h-[100px]',
    emojiSize: 'text-[50px]',
    glow: 'shadow-lg shadow-lime-400/30',
    gradient: false,
    pulse: false
  },
  STRONG: {
    label: 'STRONG',
    bgColor: 'bg-gradient-to-br from-cyan-300 to-cyan-500',
    size: 'w-[120px] h-[120px]',
    emojiSize: 'text-[60px]',
    glow: 'shadow-xl shadow-cyan-400/40',
    gradient: true,
    pulse: false
  },
  FIERY: {
    label: 'FIERY',
    bgColor: 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-purple-400',
    size: 'w-[140px] h-[140px]',
    emojiSize: 'text-[70px]',
    glow: 'shadow-2xl shadow-cyan-400/50',
    gradient: true,
    pulse: true
  }
};

export function FoxStateCard({ state, devotionScore }: FoxStateCardProps) {
  const style = FOX_STATE_STYLES[state];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Fox Visual */}
      <div className="flex flex-col items-center mb-4">
        <div
          className={`
            ${style.size}
            ${style.bgColor}
            ${style.glow}
            ${style.pulse ? 'animate-pulse' : ''}
            rounded-full
            flex items-center justify-center
            transition-all duration-300
            mb-3
          `}
        >
          <span className={style.emojiSize}>🦊</span>
        </div>
        
        {/* State Label */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {style.label}
        </h3>
      </div>

      {/* Devotion Score */}
      <div className="text-center">
        {devotionScore !== null ? (
          <>
            <div className="text-5xl font-bold text-gray-900 mb-1">
              {devotionScore}
            </div>
            <div className="text-base text-gray-600">
              devotion score
            </div>
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-gray-400 mb-1">
              --
            </div>
            <div className="text-base text-gray-600">
              devotion score
            </div>
          </>
        )}
      </div>
    </div>
  );
}

