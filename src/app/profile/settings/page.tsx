import Link from 'next/link';
import { ArrowLeft, User, LogOut } from 'lucide-react';
import { ProfileService } from '@/services/ProfileService';
import EmailEditor from '@/components/profile/EmailEditor';
import WeeklyGoalEditor from '@/components/profile/WeeklyGoalEditor';

export default async function SettingsPage() {
  const profileData = await ProfileService.getUserProfile();

  return (
    <div className="px-6 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/profile" className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="space-y-3">
        <EmailEditor initialEmail={profileData?.user.email ?? null} />

        <WeeklyGoalEditor initialGoal={profileData?.user.weeklyGoal ?? 3} />

        <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 text-left">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User size={20} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Account Settings</h3>
            <p className="text-sm text-gray-500">Name, password, etc.</p>
          </div>
        </button>

        <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 text-left">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
            <LogOut size={20} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-red-500">Sign Out</h3>
            <p className="text-sm text-gray-500">Log out of your account</p>
          </div>
        </button>
      </div>
    </div>
  );
}
