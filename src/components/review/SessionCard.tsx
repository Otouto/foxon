'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { SessionReviewData } from '@/hooks/useReviewData';
import { useDrag } from '@use-gesture/react';

interface SessionCardProps {
  session: SessionReviewData;
  onDelete: (sessionId: string) => Promise<boolean>;
}

const effortLevelConfig = {
  EASY: { label: 'Easy', color: 'bg-green-400' },
  STEADY: { label: 'Steady', color: 'bg-blue-400' },
  HARD: { label: 'Hard', color: 'bg-orange-400' },
  ALL_IN: { label: 'All-In', color: 'bg-red-400' }
};

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const effortConfig = session.effort ? effortLevelConfig[session.effort as keyof typeof effortLevelConfig] : null;

  const handleDelete = async () => {
    setIsDeleting(true);
          try {
        const success = await onDelete(session.id);
        if (success) {
          setShowConfirmDelete(false);
          setSwipeX(0); // Reset swipe position after successful delete
        }
    } catch (error) {
      console.error('Failed to delete session:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
    setSwipeX(0); // Reset swipe position when canceling
  };

  const [swipeX, setSwipeX] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  const bind = useDrag(
    ({ movement: [mx], active, velocity: [vx] }) => {
      // Only allow left swipe
      if (mx > 0) return;
      
      const swipeDistance = Math.abs(mx);
      const threshold = 80;
      const deleteThreshold = 120;
      
      if (active) {
        setIsSwipeActive(true);
        setSwipeX(mx);
      } else {
        setIsSwipeActive(false);
        
        // Auto-trigger delete if swiped far enough with sufficient velocity
        if (swipeDistance > deleteThreshold || (swipeDistance > threshold && vx > 0.5)) {
          setShowConfirmDelete(true);
          setSwipeX(0);
        } else if (swipeDistance > threshold) {
          // Keep partially revealed
          setSwipeX(-threshold);
        } else {
          // Snap back
          setSwipeX(0);
        }
      }
    },
    {
      axis: 'x',
      bounds: { left: -150, right: 0 },
      rubberband: true,
    }
  );

  return (
    <>
      <div 
        className="relative"
        style={{
          marginRight: Math.abs(swipeX) > 20 ? '60px' : '0px',
          transition: 'margin-right 0.2s ease',
        }}
      >
        {/* Delete Circle - moves with the card */}
        {Math.abs(swipeX) > 20 && (
          <div 
            className="absolute top-1/2 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white swipe-delete-circle transition-all duration-200 hover:bg-red-600 cursor-pointer z-10"
            style={{
              right: -swipeX - 60, // Position relative to card movement with padding
              transform: 'translateY(-50%)',
              opacity: Math.abs(swipeX) > 20 ? 1 : 0,
              scale: Math.abs(swipeX) > 60 ? '1.1' : '1',
            }}
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash2 size={18} />
          </div>
        )}
        
        {/* Main Content */}
        <div 
          {...bind()}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-transform duration-200 touch-pan-y select-none"
          style={{
            transform: `translateX(${swipeX}px)`,
            cursor: isSwipeActive ? 'grabbing' : 'grab',
          }}
        >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{formatDate(session.date)}</h3>
          <span className="text-sm text-gray-500">{formatDateShort(session.date)}</span>
        </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{session.workoutTitle || 'Custom Workout'}</span>
          {effortConfig && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{effortConfig.label}</span>
              <div className={`w-3 h-3 ${effortConfig.color} rounded-full`}></div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{session.devotionScore ? `${session.devotionScore}/100` : 'No score'}</span>
          <span>{session.devotionGrade || 'Not graded'}</span>
        </div>
        
        {session.vibeLine && (
          <p className="text-sm text-gray-500">&ldquo;{session.vibeLine}&rdquo;</p>
        )}
        </div>
      </div>
      </div>

      {/* Delete Confirmation Modal - Rendered outside the swipe container */}
      {showConfirmDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white rounded-3xl p-8 mx-4 max-w-md w-full shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              {/* Enhanced Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Trash2 size={32} className="text-red-600" />
              </div>
              
              {/* Enhanced Typography */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Delete Session?</h3>
              <div className="mb-2">
                <p className="text-lg font-medium text-gray-800">
                  {session.workoutTitle || 'Custom Workout'}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(session.date)} • {session.devotionScore ? `${session.devotionScore}/100` : 'No score'}
                </p>
              </div>
              <p className="text-gray-600 mb-8 leading-relaxed">
                This will permanently delete this workout session and all its data. This action cannot be undone.
              </p>
              
              {/* Enhanced Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-2xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
