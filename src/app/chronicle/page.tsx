import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUserId } from '@/lib/auth';
import { ChronicleService } from '@/services/ChronicleService';
import ChronicleCard from '@/components/chronicle/ChronicleCard';
import GenerateChronicleButton from '@/components/chronicle/GenerateChronicleButton';

export default async function ChroniclePage() {
  const userId = getCurrentUserId();
  const chronicles = await ChronicleService.listChronicles(userId);

  // Target the last fully completed month for generation
  const now = new Date();
  const targetMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  return (
    <div className="px-6 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/profile"
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fox Chronicle</h1>
          <p className="text-sm text-gray-500">Your monthly journey chapters</p>
        </div>
      </div>

      {/* Generate current month — only shown when no chapters exist yet */}
      {chronicles.length === 0 && (
        <div className="mb-6">
          <GenerateChronicleButton
            month={targetMonth}
            year={targetYear}
          />
        </div>
      )}

      {/* Chronicle list */}
      {chronicles.length > 0 ? (
        <div className="space-y-3">
          {chronicles.map(c => (
            <ChronicleCard
              key={c.id}
              id={c.id}
              chapterNumber={c.chapterNumber}
              title={c.title}
              month={c.month}
              year={c.year}
              emailSentAt={c.emailSentAt?.toISOString() || null}
              createdAt={c.createdAt.toISOString()}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📖</div>
          <h3 className="font-semibold text-gray-900 mb-2">No chapters yet</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Generate your first Fox Chronicle to see your monthly journey story.
            Chronicles are also emailed automatically on the 1st of each month.
          </p>
        </div>
      )}
    </div>
  );
}

