'use client';

import { useState } from 'react';
import { Mail, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BottomSheet, BottomSheetTitle, BottomSheetDescription } from '@/components/ui/BottomSheet';

interface ChronicleActionsProps {
  id: string;
  month: number;
  year: number;
}

export default function ChronicleActions({ id, month, year }: ChronicleActionsProps) {
  const router = useRouter();

  const [regenerating, setRegenerating] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch('/api/chronicle/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, sendEmail: false }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to regenerate');
      }
      const result = await res.json();
      router.push(`/chronicle/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
      setRegenerating(false);
    }
  };

  const handleSendEmail = async () => {
    setEmailSending(true);
    try {
      const res = await fetch(`/api/chronicle/${id}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send email');
      }
      toast.success('Email sent!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setEmailSending(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/chronicle/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      router.push('/chronicle');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
      setDeleting(false);
      setDeleteSheetOpen(false);
    }
  };

  return (
    <div className="mt-6 space-y-2">
      {/* Regenerate */}
      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="w-full bg-cyan-500 text-white font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {regenerating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Regenerating…</span>
          </>
        ) : (
          <span>Regenerate chapter</span>
        )}
      </button>

      {/* Send to email */}
      <button
        onClick={handleSendEmail}
        disabled={emailSending}
        className="w-full bg-gray-100 text-gray-700 font-medium rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {emailSending ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Sending email…</span>
          </>
        ) : (
          <>
            <Mail size={18} />
            <span>Send to Email</span>
          </>
        )}
      </button>

      {/* Delete */}
      <button
        onClick={() => setDeleteSheetOpen(true)}
        className="w-full border border-red-200 text-red-500 font-medium rounded-2xl py-3 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={16} />
        <span>Delete chapter</span>
      </button>

      {/* Delete confirmation bottom sheet */}
      <BottomSheet isOpen={deleteSheetOpen} onClose={() => !deleting && setDeleteSheetOpen(false)} dismissible={!deleting}>
        <div className="px-6 pb-2 pt-2">
          <BottomSheetTitle className="text-lg font-semibold text-gray-900 mb-1">
            Delete chapter?
          </BottomSheetTitle>
          <BottomSheetDescription className="text-sm text-gray-500 mb-6">
            This chapter will be permanently deleted and cannot be recovered.
          </BottomSheetDescription>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full bg-red-500 text-white font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mb-3"
          >
            {deleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Deleting…</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </button>

          <button
            onClick={() => setDeleteSheetOpen(false)}
            disabled={deleting}
            className="w-full bg-gray-100 text-gray-700 font-medium rounded-2xl py-4 hover:bg-gray-200 disabled:opacity-60 transition-colors mb-2"
          >
            Cancel
          </button>
        </div>
        <div className="pb-safe h-4" />
      </BottomSheet>
    </div>
  );
}
