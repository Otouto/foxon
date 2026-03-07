import Link from 'next/link';
import { Settings } from 'lucide-react';

interface IdentityHeaderProps {
  displayName: string | null;
  firstSessionDate: Date | null;
}

export function IdentityHeader({ displayName, firstSessionDate }: IdentityHeaderProps) {
  const trainingSince = firstSessionDate
    ? firstSessionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {displayName || 'Athlete'}
        </h1>
        {trainingSince && (
          <p className="text-sm text-gray-500 mt-1">
            Training since {trainingSince}
          </p>
        )}
      </div>
      <Link
        href="/profile/settings"
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Settings size={22} />
      </Link>
    </div>
  );
}
