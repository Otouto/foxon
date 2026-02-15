import Link from 'next/link';
import { DashboardService } from '@/services/DashboardService';
import { FoxStateCard, WeekProgressCard, NextWorkoutCard } from '@/components/dashboard';

export default async function Home() {
  const dashboardData = await DashboardService.getDashboardData();

  return (
    <div className="px-6 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Hey, Dmytro!</h1>
          <p className="text-sm text-gray-500">Ready to train?</p>
        </div>
        <Link href="/profile" className="p-2 text-gray-400 hover:text-gray-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </Link>
      </div>

      {/* Dashboard Components */}
      <div className="space-y-4">
        {/* Fox State + Devotion Score */}
        <FoxStateCard 
          state={dashboardData.foxState.state}
          devotionScore={dashboardData.foxState.devotionScore}
        />

        {/* This Week Progress */}
        <WeekProgressCard 
          completed={dashboardData.weekProgress.completed}
          planned={dashboardData.weekProgress.planned}
          isComplete={dashboardData.weekProgress.isComplete}
        />

        {/* Next Workout or Completion Card */}
        <NextWorkoutCard
          workout={dashboardData.nextWorkout}
          isWeekComplete={dashboardData.weekProgress.isComplete}
          completedThisWeek={dashboardData.weekProgress.completed}
        />
      </div>
    </div>
  );
}
