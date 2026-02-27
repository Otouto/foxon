'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateChronicleButtonProps {
  month: number;
  year: number;
  label?: string;
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function GenerateChronicleButton({
  month, year, label,
}: GenerateChronicleButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/chronicle/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, sendEmail: false }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate chronicle');
      }

      const result = await response.json();
      router.push(`/chronicle/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-amber-500 text-white rounded-2xl p-4 font-medium flex items-center justify-center gap-2 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Generating {MONTH_NAMES[month]} chapter...</span>
          </>
        ) : (
          <>
            <Sparkles size={18} />
            <span>{label || `Generate ${MONTH_NAMES[month]} ${year} Chronicle`}</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
