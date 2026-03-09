'use client';

import Link from 'next/link';
import { ProgressionState } from '@prisma/client';

interface FormScoreBreakdown {
  attendance: number;
  quality: number;
  consistency: number;
}

interface FoxStateCardProps {
  state: ProgressionState;
  formScore: number;
  formScoreBreakdown: FormScoreBreakdown;
}

const FOX_STATE_STYLES = {
  SLIM: {
    label: 'SLIM',
    bgColor: 'bg-gray-200',
    size: 'w-16 h-16',
    emojiSize: 'text-[32px]',
    glow: '',
    barColor: 'bg-gray-400',
    pulse: false
  },
  FIT: {
    label: 'FIT',
    bgColor: 'bg-lime-400',
    size: 'w-20 h-20',
    emojiSize: 'text-[40px]',
    glow: 'shadow-lg shadow-lime-400/30',
    barColor: 'bg-lime-500',
    pulse: false
  },
  STRONG: {
    label: 'STRONG',
    bgColor: 'bg-gradient-to-br from-cyan-300 to-cyan-500',
    size: 'w-24 h-24',
    emojiSize: 'text-[48px]',
    glow: 'shadow-xl shadow-cyan-400/40',
    barColor: 'bg-cyan-500',
    pulse: false
  },
  FIERY: {
    label: 'FIERY',
    bgColor: 'bg-gradient-to-br from-cyan-400 via-cyan-500 to-purple-400',
    size: 'w-28 h-28',
    emojiSize: 'text-[56px]',
    glow: 'shadow-2xl shadow-cyan-400/50',
    barColor: 'bg-gradient-to-r from-cyan-500 to-purple-500',
    pulse: true
  }
};

const PILLARS: { key: keyof FormScoreBreakdown; label: string }[] = [
  { key: 'attendance',  label: 'Attendance'  },
  { key: 'quality',     label: 'Quality'     },
  { key: 'consistency', label: 'Consistency' },
];

export function FoxStateCard({ state, formScore, formScoreBreakdown }: FoxStateCardProps) {
  const style = FOX_STATE_STYLES[state];

  return (
    <Link href="/profile" className="block">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        {/* Fox Visual */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative mb-2">
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
            <div className={`absolute inset-0 flex items-center justify-center ${style.emojiSize}`}>
              🦊
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {style.label}
          </h3>
        </div>

        {/* Form Score */}
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-gray-900 mb-0.5">
            {formScore}
          </div>
          <div className="text-sm text-gray-500">
            form score · 6 weeks
          </div>
        </div>

        {/* Pillar Breakdown */}
        <div className="space-y-2">
          {PILLARS.map(({ key, label }) => {
            const value = formScoreBreakdown[key];
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-[76px] shrink-0">
                  {label}
                </span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${style.barColor} transition-all duration-500`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 w-7 text-right shrink-0">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
}
