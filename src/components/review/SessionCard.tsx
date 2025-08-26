'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionReviewData } from '@/hooks/useReviewData';
import { formatDate } from '@/lib/utils/dateUtils';
import { SwipeableCard } from './SwipeableCard';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { SessionCardContent } from './SessionCardContent';

interface SessionCardProps {
  session: SessionReviewData;
  onDelete: (sessionId: string) => Promise<boolean>;
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };

  const handleDeleteRequest = () => {
    setShowConfirmDelete(true);
  };

  const handleCardClick = () => {
    router.push(`/session/${session.id}/details`);
  };

  return (
    <>
      <SwipeableCard onDeleteRequest={handleDeleteRequest}>
        <div onClick={handleCardClick} className="cursor-pointer">
          <SessionCardContent session={session} />
        </div>
      </SwipeableCard>

      <DeleteConfirmationModal
        isOpen={showConfirmDelete}
        isDeleting={isDeleting}
        title={session.workoutTitle || 'Custom Workout'}
        subtitle={`${formatDate(session.date)} • ${session.devotionScore ? `${session.devotionScore}/100` : 'No score'}`}
        onConfirm={handleDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
