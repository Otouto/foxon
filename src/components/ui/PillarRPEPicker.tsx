'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { EffortLevel } from '@prisma/client';

interface PillarRPEPickerProps {
  value: number; // 1-10 scale
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

// RPE Scale mapping to descriptive bands
const RPE_BANDS = {
  EASY: { range: [1, 2, 3] as const, label: 'Easy', description: 'Not challenging. Could go a long time.' },
  MODERATE: { range: [4, 5, 6] as const, label: 'Moderate', description: 'Working but comfortable. Could go for a while.' },
  HARD: { range: [7, 8] as const, label: 'Hard', description: 'Challenging and uncomfortable. Could not go on for long.' },
  ALL_OUT: { range: [9, 10] as const, label: 'All Out', description: 'Extremely uncomfortable. Could barely continue.' }
} as const;

// Helper function to get band info for a given RPE value
function getBandForValue(value: number) {
  if (value >= 1 && value <= 3) {
    return { name: 'EASY', ...RPE_BANDS.EASY };
  } else if (value >= 4 && value <= 6) {
    return { name: 'MODERATE', ...RPE_BANDS.MODERATE };
  } else if (value >= 7 && value <= 8) {
    return { name: 'HARD', ...RPE_BANDS.HARD };
  } else if (value >= 9 && value <= 10) {
    return { name: 'ALL_OUT', ...RPE_BANDS.ALL_OUT };
  }
  return { name: 'MODERATE', ...RPE_BANDS.MODERATE };
}

// Convert RPE value (1-10) to EffortLevel enum
export function rpeToEffortLevel(rpe: number): EffortLevel {
  const mapping: Record<number, EffortLevel> = {
    1: EffortLevel.EASY_1,
    2: EffortLevel.EASY_2,
    3: EffortLevel.EASY_3,
    4: EffortLevel.MODERATE_4,
    5: EffortLevel.MODERATE_5,
    6: EffortLevel.MODERATE_6,
    7: EffortLevel.HARD_7,
    8: EffortLevel.HARD_8,
    9: EffortLevel.ALL_OUT_9,
    10: EffortLevel.ALL_OUT_10,
  };
  return mapping[rpe] || EffortLevel.MODERATE_6;
}

// Convert EffortLevel enum to RPE value (1-10)
export function effortLevelToRpe(effortLevel: EffortLevel): number {
  const mapping: Record<EffortLevel, number> = {
    [EffortLevel.EASY_1]: 1,
    [EffortLevel.EASY_2]: 2,
    [EffortLevel.EASY_3]: 3,
    [EffortLevel.MODERATE_4]: 4,
    [EffortLevel.MODERATE_5]: 5,
    [EffortLevel.MODERATE_6]: 6,
    [EffortLevel.HARD_7]: 7,
    [EffortLevel.HARD_8]: 8,
    [EffortLevel.ALL_OUT_9]: 9,
    [EffortLevel.ALL_OUT_10]: 10,
  };
  return mapping[effortLevel] || 6;
}

export default function PillarRPEPicker({ value, onChange, disabled = false, className = '' }: PillarRPEPickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentBand = getBandForValue(value);

  // Calculate pillar heights and positions - 4 pillars with proper grouping
  const pillars = Array.from({ length: 4 }, (_, index) => {
    const pillarIndex = index;
    const baseHeight = 60 + (pillarIndex * 18); // Increasing height: 60, 78, 96, 114
    
    // Determine which values belong to this pillar (proper band grouping)
    let pillarValues: number[] = [];
    if (pillarIndex === 0) pillarValues = [1, 2, 3]; // Easy: 1-3
    else if (pillarIndex === 1) pillarValues = [4, 5, 6]; // Moderate: 4-6
    else if (pillarIndex === 2) pillarValues = [7, 8]; // Hard: 7-8
    else if (pillarIndex === 3) pillarValues = [9, 10]; // All Out: 9-10

    const isActive = pillarValues.includes(value);
    
    return {
      height: baseHeight,
      isActive,
      values: pillarValues,
      index: pillarIndex
    };
  });

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (disabled) return;
    
    setIsDragging(true);
    
    // Calculate initial selection based on click position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const pillarWidth = rect.width / 4;
      const pillarIndex = Math.floor(x / pillarWidth);
      
      // Map pillar index to RPE values based on proper grouping
      let newValue = value;
      if (pillarIndex === 0) {
        // Easy: 1-3, select middle value based on position within pillar
        const relativeX = (x % pillarWidth) / pillarWidth;
        if (relativeX < 0.33) newValue = 1;
        else if (relativeX < 0.67) newValue = 2;
        else newValue = 3;
      } else if (pillarIndex === 1) {
        // Moderate: 4-6
        const relativeX = (x % pillarWidth) / pillarWidth;
        if (relativeX < 0.33) newValue = 4;
        else if (relativeX < 0.67) newValue = 5;
        else newValue = 6;
      } else if (pillarIndex === 2) {
        // Hard: 7-8
        const relativeX = (x % pillarWidth) / pillarWidth;
        newValue = relativeX < 0.5 ? 7 : 8;
      } else if (pillarIndex === 3) {
        // All Out: 9-10
        const relativeX = (x % pillarWidth) / pillarWidth;
        newValue = relativeX < 0.5 ? 9 : 10;
      }
      
      if (newValue !== value) {
        onChange(newValue);
        
        // Haptic feedback simulation
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    }
  }, [disabled, value, onChange]);

  const handlePointerMove = useCallback((clientX: number) => {
    if (!isDragging || disabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pillarWidth = rect.width / 4;
    const pillarIndex = Math.max(0, Math.min(3, Math.floor(x / pillarWidth)));
    
    // Map pillar index to RPE values with fine-grained control
    let newValue = value;
    const relativeX = (x % pillarWidth) / pillarWidth;
    
    if (pillarIndex === 0) {
      // Easy: 1-3
      if (relativeX < 0.33) newValue = 1;
      else if (relativeX < 0.67) newValue = 2;
      else newValue = 3;
    } else if (pillarIndex === 1) {
      // Moderate: 4-6
      if (relativeX < 0.33) newValue = 4;
      else if (relativeX < 0.67) newValue = 5;
      else newValue = 6;
    } else if (pillarIndex === 2) {
      // Hard: 7-8
      newValue = relativeX < 0.5 ? 7 : 8;
    } else if (pillarIndex === 3) {
      // All Out: 9-10
      newValue = relativeX < 0.5 ? 9 : 10;
    }
    
    if (newValue !== value) {
      onChange(newValue);
      
      // Haptic feedback simulation
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }
  }, [isDragging, disabled, value, onChange]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global pointer event handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalPointerMove = (event: PointerEvent) => {
      handlePointerMove(event.clientX);
    };

    const handleGlobalPointerUp = () => {
      handlePointerUp();
    };

    document.addEventListener('pointermove', handleGlobalPointerMove);
    document.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      document.removeEventListener('pointermove', handleGlobalPointerMove);
      document.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <div className={`${className}`}>
      {/* Pillar Container - 32pt after any description above */}
      <div
        ref={containerRef}
        className={`relative w-full h-40 flex items-end justify-between gap-3 px-6 py-4 cursor-pointer select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={(e) => handlePointerMove(e.clientX)}
        style={{ touchAction: 'none', marginTop: '32pt' }}
      >
        {pillars.map((pillar, index) => (
          <div
            key={index}
            className="relative flex-1 flex flex-col items-center"
          >
            {/* Pillar Capsule */}
            <div
              className={`relative w-full transition-all duration-300 ease-out ${
                pillar.isActive 
                  ? 'transform scale-105' 
                  : 'transform scale-100'
              }`}
              style={{
                height: `${pillar.height}px`,
                transform: `skewX(-6deg) ${pillar.isActive ? 'scale(1.05)' : 'scale(1)'}`,
              }}
            >
              {/* Capsule Body - Rounded */}
              <div
                className={`w-full h-full rounded-full transition-all duration-300 ${
                  pillar.isActive
                    ? 'bg-lime-400 shadow-md shadow-lime-400/20'
                    : 'bg-gray-200'
                }`}
              />
            </div>
            
            {/* Tick Markers at Base - 6-8pt diameter dots with 8-10pt spacing */}
            <div 
              className="flex justify-center items-center mt-2" 
              style={{ gap: '8pt' }}
            >
              {pillar.values.map((tickValue) => (
                <div
                  key={tickValue}
                  className={`rounded-full transition-colors duration-200 ${
                    tickValue === value
                      ? 'bg-lime-500'
                      : 'bg-gray-300'
                  }`}
                  style={{ 
                    width: '7pt', 
                    height: '7pt',
                    marginBottom: '6pt'
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Value Chip Row - 16pt after pillars, full width placement */}
      <div className="flex justify-center w-full" style={{ marginTop: '16pt' }}>
        <div className="inline-flex items-center gap-3 bg-gray-50 rounded-full px-5 py-3">
          {/* Number Badge */}
          <div className="flex-shrink-0 w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-sm">{value}</span>
          </div>
          
          {/* Band Label */}
          <span className="font-medium text-gray-900 text-base">
            {currentBand.label}
          </span>
        </div>
      </div>

    </div>
  );
}