'use client';

import { useState } from 'react';
import { Mail, Loader2, Check } from 'lucide-react';

export default function SendTestEmailButton() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setStatus('sending');
    setError(null);

    try {
      const response = await fetch('/api/chronicle/send-test', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send test email');
      }

      setStatus('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  };

  return (
    <div>
      <button
        onClick={handleSend}
        disabled={status === 'sending'}
        className={`w-full rounded-2xl p-4 font-medium flex items-center justify-center gap-2 transition-colors ${
          status === 'sent'
            ? 'bg-emerald-500 text-white'
            : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-60'
        }`}
      >
        {status === 'sending' ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Generating & sending...</span>
          </>
        ) : status === 'sent' ? (
          <>
            <Check size={18} />
            <span>Test email sent!</span>
          </>
        ) : (
          <>
            <Mail size={18} />
            <span>Send Test Email (February 2026)</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
