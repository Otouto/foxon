'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { SessionReviewData } from '@/hooks/useReviewData';

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
        }
    } catch (error) {
      console.error('Failed to delete session:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{formatDate(session.date)}</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{formatDateShort(session.date)}</span>
          
          {/* Direct Delete Button */}
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 rounded-full bg-red-50 hover:bg-red-100 transition-colors group"
            title="Delete session"
          >
            <Trash2 size={16} className="text-red-500 group-hover:text-red-600" />
          </button>
        </div>
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

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 mx-4 max-w-md w-full shadow-2xl transform transition-all">
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
                  onClick={() => setShowConfirmDelete(false)}
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
                      <span>Delete Session</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
