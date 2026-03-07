import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { ChronicleEntryInfo } from '@/services/ProfileService';

interface ChronicleEntryCardProps {
  entry: ChronicleEntryInfo;
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function ChronicleEntryCard({ entry }: ChronicleEntryCardProps) {
  if (entry.state === 'brand_new') {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen size={20} className="text-gray-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-400">Fox Chronicle</h3>
            <p className="text-sm text-gray-400">Train to unlock your story</p>
          </div>
        </div>
      </div>
    );
  }

  if (entry.state === 'no_chapter') {
    return (
      <Link
        href="/chronicle"
        className="block bg-amber-50 rounded-2xl p-5 shadow-sm border border-amber-100 mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <BookOpen size={20} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-amber-900">Fox Chronicle</h3>
            <p className="text-sm text-amber-700">Your first chapter is ready to be written</p>
          </div>
          <span className="text-amber-400 text-lg">&rsaquo;</span>
        </div>
      </Link>
    );
  }

  const chapter = entry.latestChapter!;
  const monthName = MONTH_NAMES[chapter.month];

  return (
    <Link
      href={`/chronicle/${chapter.id}`}
      className="block bg-amber-50 rounded-2xl p-5 shadow-sm border border-amber-100 mb-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <BookOpen size={20} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-amber-900 truncate">{chapter.title}</h3>
          <p className="text-sm text-amber-700">{monthName} {chapter.year}</p>
        </div>
        <span className="text-amber-400 text-lg">&rsaquo;</span>
      </div>
    </Link>
  );
}
