'use client';

import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ redirectUrl: '/sign-in' })}
      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 text-left"
    >
      <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
        <LogOut size={20} className="text-red-500" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-red-500">Sign Out</h3>
        <p className="text-sm text-gray-500">Log out of your account</p>
      </div>
    </button>
  );
}
