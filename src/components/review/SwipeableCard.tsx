'use client';

import { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { useSwipeToDelete, SwipeConfig } from '@/hooks/useSwipeToDelete';

interface SwipeableCardProps {
  children: ReactNode;
  onDeleteRequest: () => void;
  swipeConfig?: Partial<SwipeConfig>;
  className?: string;
}

export function SwipeableCard({ 
  children, 
  onDeleteRequest, 
  swipeConfig,
  className = '' 
}: SwipeableCardProps) {
  const { swipeX, isSwipeActive, bind, isRevealed } = useSwipeToDelete(
    onDeleteRequest,
    swipeConfig
  );

  return (
    <div 
      className="relative"
      style={{
        marginRight: isRevealed ? '60px' : '0px',
        transition: 'margin-right 0.2s ease',
      }}
    >
      {/* Delete Circle */}
      {isRevealed && (
        <div 
          className="absolute top-1/2 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white swipe-delete-circle transition-all duration-200 hover:bg-red-600 cursor-pointer z-10"
          style={{
            right: -swipeX - 60,
            transform: 'translateY(-50%)',
            opacity: isRevealed ? 1 : 0,
            scale: Math.abs(swipeX) > 60 ? '1.1' : '1',
          }}
          onClick={onDeleteRequest}
        >
          <Trash2 size={18} />
        </div>
      )}
      
      {/* Main Content */}
      <div 
        {...bind()}
        className={`transition-transform duration-200 touch-pan-y select-none ${className}`}
        style={{
          transform: `translateX(${swipeX}px)`,
          cursor: isSwipeActive ? 'grabbing' : 'grab',
        }}
      >
        {children}
      </div>
    </div>
  );
}