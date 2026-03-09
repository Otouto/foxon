import { ProfileService } from '@/services/ProfileService';
import { IdentityHeader } from '@/components/profile/IdentityHeader';
import { FoxEvolutionTimeline } from '@/components/profile/FoxEvolutionTimeline';
import { TrainingPulseGrid } from '@/components/profile/TrainingPulseGrid';
import { KeyNumbersRow } from '@/components/profile/KeyNumbersRow';
import { ChronicleEntryCard } from '@/components/profile/ChronicleEntryCard';


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

  const { user, stats, monthAwareDevotion, firstSessionDate, trainingPulse, chronicleEntry } = profileData;

  return (
    <div className="px-6 py-8 pb-24">
      <IdentityHeader
        displayName={user.displayName}
        firstSessionDate={firstSessionDate}
      />

      <FoxEvolutionTimeline currentState={user.foxLevel} />

      <TrainingPulseGrid
        grid={trainingPulse.grid}
        totalSessions={trainingPulse.totalSessions}
        weekStreak={trainingPulse.weekStreak}
      />

      <KeyNumbersRow
        totalSessions={stats.completedSessions}
        weekStreak={stats.currentWeekStreak}
        devotion={monthAwareDevotion}
      />

      <ChronicleEntryCard entry={chronicleEntry} />
    </div>
  );
}
