'use client';

import { useState } from 'react';
import { useDrag } from '@use-gesture/react';

export interface SwipeConfig {
  threshold: number;
  deleteThreshold: number;
  maxSwipeDistance: number;
  velocityThreshold: number;
}

const defaultConfig: SwipeConfig = {
  threshold: 80,
  deleteThreshold: 120,
  maxSwipeDistance: 150,
  velocityThreshold: 0.5
};

export function useSwipeToDelete(
  onDeleteRequest: () => void,
  config: Partial<SwipeConfig> = {}
) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  const finalConfig = { ...defaultConfig, ...config };

  const bind = useDrag(
    ({ movement: [mx], active, velocity: [vx] }) => {
      // Only allow left swipe
      if (mx > 0) return;
      
      const swipeDistance = Math.abs(mx);
      
      if (active) {
        setIsSwipeActive(true);
        setSwipeX(mx);
      } else {
        setIsSwipeActive(false);
        
        // Auto-trigger delete if swiped far enough with sufficient velocity
        if (
          swipeDistance > finalConfig.deleteThreshold || 
          (swipeDistance > finalConfig.threshold && vx > finalConfig.velocityThreshold)
        ) {
          onDeleteRequest();
          setSwipeX(0);
        } else if (swipeDistance > finalConfig.threshold) {
          // Keep partially revealed
          setSwipeX(-finalConfig.threshold);
        } else {
          // Snap back
          setSwipeX(0);
        }
      }
    },
    {
      axis: 'x',
      bounds: { left: -finalConfig.maxSwipeDistance, right: 0 },
      rubberband: true,
    }
  );

  const resetSwipe = () => setSwipeX(0);

  return {
    swipeX,
    isSwipeActive,
    bind,
    resetSwipe,
    isRevealed: Math.abs(swipeX) > 20
  };
}