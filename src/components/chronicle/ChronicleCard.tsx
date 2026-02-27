'use client';

import Link from 'next/link';
import { BookOpen, Mail } from 'lucide-react';

interface ChronicleCardProps {
  id: string;
  chapterNumber: number;
  title: string;
  month: number;
  year: number;
  emailSentAt: string | null;
  createdAt: string;
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ChronicleCard({
  id, chapterNumber, title, month, year, emailSentAt,
}: ChronicleCardProps) {
  return (
    <Link
      href={`/chronicle/${id}`}
      className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-gray-200 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen size={22} className="text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Chapter {chapterNumber}
          </p>
          <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {MONTH_NAMES[month]} {year}
          </p>
          {emailSentAt && (
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
              <Mail size={12} />
              <span>Email sent</span>
            </div>
          )}
        </div>
        <span className="text-gray-300 text-xl mt-1">&rsaquo;</span>
      </div>
    </Link>
  );
}
