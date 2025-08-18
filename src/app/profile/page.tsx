import { Settings, User, Target, Download, LogOut } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="px-6 py-8 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile</h1>

      {/* User Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-lime-400 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-black">D</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dmytro</h2>
            <p className="text-gray-500">@dmytrolutsik</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">24</p>
            <p className="text-sm text-gray-500">Workouts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">8</p>
            <p className="text-sm text-gray-500">Week Streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">2.1k</p>
            <p className="text-sm text-gray-500">Total Volume</p>
          </div>
        </div>
      </div>

      {/* Fox Progress */}
      <div className="bg-gradient-to-r from-lime-400 to-cyan-400 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Fox Level</h3>
            <p className="text-sm opacity-90">Strong Fox 🦊</p>
          </div>
          <div className="text-3xl">💪</div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div className="bg-white h-2 rounded-full" style={{ width: '75%' }}></div>
        </div>
        <p className="text-sm mt-2 opacity-90">3 more workouts to reach Fiery Fox!</p>
      </div>

      {/* Settings Menu */}
      <div className="space-y-3">
        <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 text-left">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Target size={20} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Weekly Goal</h3>
            <p className="text-sm text-gray-500">2 workouts per week</p>
          </div>
        </button>

        <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 text-left">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User size={20} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Account Settings</h3>
            <p className="text-sm text-gray-500">Privacy, notifications</p>
          </div>
        </button>

        <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 text-left">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Download size={20} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Export Data</h3>
            <p className="text-sm text-gray-500">Download your workout data</p>
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
