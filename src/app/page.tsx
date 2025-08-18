import Link from 'next/link';

export default function Home() {
  return (
    <div className="px-6 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center hover:scale-105 transition-transform">
            <span className="text-xl font-bold text-black">🦊</span>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Hey, Dmytro!</h1>
            <p className="text-sm text-gray-500">Ready to train?</p>
          </div>
        </div>
        <Link href="/profile" className="p-2 text-gray-400 hover:text-gray-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </Link>
      </div>



      {/* Weekly Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week</h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600">Progress</span>
          <span className="text-sm font-medium text-gray-900">1 of 2 workouts</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-lime-400 h-2 rounded-full" style={{ width: '50%' }}></div>
        </div>
        <p className="text-sm text-gray-500 mt-3">1 more workout to level up! 🚀</p>
      </div>
    </div>
  );
}
