import { User, LogOut } from 'lucide-react';
import { ProfileService } from '@/services/ProfileService';
import WeeklyGoalEditor from '@/components/profile/WeeklyGoalEditor';

export default async function ProfilePage() {
  const profileData = await ProfileService.getUserProfile();
  
  if (!profileData) {
    return (
      <div className="px-6 py-8 pb-24">
        <div className="text-center py-12">
          <p className="text-gray-500">Unable to load profile data</p>
        </div>
      </div>
    );
  }

  const { user, stats } = profileData;
  const progressionInfo = ProfileService.getProgressionInfo(user.progressionState);
  
  // Removed formatVolume function - no longer needed with devotion scoring

  // Get user initials for avatar
  const getUserInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="px-6 py-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile</h1>

      {/* User Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-lime-400 rounded-full flex items-center justify-center">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.displayName || 'User'} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-black">
                {getUserInitials(user.displayName)}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user.displayName || 'User'}
            </h2>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
            <p className="text-sm text-gray-500">Sessions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.currentWeekStreak}</p>
            <p className="text-sm text-gray-500">Week Streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.averageDevotionScore || 'N/A'}</p>
            <p className="text-sm text-gray-500">Avg Devotion Score</p>
          </div>
        </div>
      </div>

      {/* Fox Progress */}
      <div className="bg-gradient-to-r from-lime-400 to-cyan-400 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Fox Level</h3>
            <p className="text-sm opacity-90">{progressionInfo.name} {progressionInfo.emoji}</p>
          </div>
          <div className="text-3xl">{progressionInfo.emoji}</div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full" 
            style={{ width: `${progressionInfo.progress}%` }}
          ></div>
        </div>
        <p className="text-sm mt-2 opacity-90">
          {progressionInfo.nextLevel 
            ? `Keep training to reach ${progressionInfo.nextLevel}!`
            : `You've reached the highest level! 🔥`
          }
        </p>
      </div>

      {/* Settings Menu */}
      <div className="space-y-3">
        <WeeklyGoalEditor initialGoal={user.weeklyGoal} />

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
