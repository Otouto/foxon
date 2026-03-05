'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface GenerateChronicleButtonProps {
  month: number;
  year: number;
  label?: string;
}

export default function GenerateChronicleButton({
  month, year, label,
}: GenerateChronicleButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setIsGenerating(true);

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
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="w-full bg-cyan-500 text-white rounded-2xl p-4 font-medium flex items-center justify-center gap-2 hover:bg-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {isGenerating ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>Generating chapter…</span>
        </>
      ) : (
        <span>{label || 'Generate your first chapter'}</span>
      )}
    </button>
  );
}
