'use client';

import { useState } from 'react';
import { Sparkles, Mail, Trash2, Loader2, Check, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface ChronicleActionsProps {
  id: string;
  month: number;
  year: number;
}

export default function ChronicleActions({ id, month, year }: ChronicleActionsProps) {
  const router = useRouter();

  const [regenerating, setRegenerating] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setRegenerating(false);
    }
  };

  const handleSendEmail = async () => {
    setEmailStatus('sending');
    setError(null);
    try {
      const res = await fetch(`/api/chronicle/${id}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send email');
      }
      setEmailStatus('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setEmailStatus('error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/chronicle/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      router.push('/chronicle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="mt-6 space-y-2">
        {error && (
          <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-4 py-2">{error}</p>
        )}

        {/* Regenerate */}
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="w-full bg-lime-400 text-black font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-lime-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {regenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Regenerating {MONTH_NAMES[month]} chapter…</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Regenerate {MONTH_NAMES[month]} {year} Chapter</span>
            </>
          )}
        </button>

        {/* Send to email */}
        <button
          onClick={handleSendEmail}
          disabled={emailStatus === 'sending'}
          className={`w-full font-medium rounded-2xl py-4 flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
            emailStatus === 'sent'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {emailStatus === 'sending' ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Sending email…</span>
            </>
          ) : emailStatus === 'sent' ? (
            <>
              <Check size={18} />
              <span>Email sent!</span>
            </>
          ) : (
            <>
              <Mail size={18} />
              <span>Send to Email</span>
            </>
          )}
        </button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 bg-gray-100 text-gray-700 font-medium rounded-2xl py-3 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-500 text-white font-medium rounded-2xl py-3 flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-60 transition-colors"
            >
              {deleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <AlertTriangle size={16} />
                  <span>Yes, delete</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            className="w-full border border-red-200 text-red-500 font-medium rounded-2xl py-3 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
            <span>Delete chapter</span>
          </button>
        )}
    </div>
  );
}
