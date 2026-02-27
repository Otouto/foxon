import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChronicleService } from '@/services/ChronicleService';
import ChronicleContent from '@/components/chronicle/ChronicleContent';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default async function ChronicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chronicle = await ChronicleService.getChronicle(id);

  if (!chronicle) {
    notFound();
  }

  return (
    <div className="px-6 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/chronicle"
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">
            Chapter {chronicle.chapterNumber}
          </p>
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {chronicle.title}
          </h1>
          <p className="text-sm text-gray-500">
            {MONTH_NAMES[chronicle.month]} {chronicle.year}
          </p>
        </div>
      </div>

      {/* Email status */}
      {chronicle.emailSentAt && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2 mb-6">
          <Mail size={14} />
          <span>
            Email sent on{' '}
            {new Date(chronicle.emailSentAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      )}

      {/* Chronicle content */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <ChronicleContent contentMd={chronicle.contentMd} />
      </div>
    </div>
  );
}
