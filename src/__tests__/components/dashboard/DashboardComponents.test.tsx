import { render, screen } from '@testing-library/react';

// Mock next/link as a simple <a> passthrough
jest.mock('next/link', () => {
  return ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  );
});

// Mock @prisma/client to provide ProgressionState enum
jest.mock('@prisma/client', () => ({
  ProgressionState: {
    SLIM: 'SLIM',
    FIT: 'FIT',
    STRONG: 'STRONG',
    FIERY: 'FIERY',
  },
}));

// Mock formatDate to return a predictable string
jest.mock('@/lib/utils/dateUtils', () => ({
  formatDate: () => 'Mar 1, 2026',
}));

import { NextWorkoutCard } from '@/components/dashboard/NextWorkoutCard';
import { WeekProgressCard } from '@/components/dashboard/WeekProgressCard';
import { FoxStateCard } from '@/components/dashboard/FoxStateCard';
import { LastSessionSnapshot } from '@/components/dashboard/LastSessionSnapshot';

// ─── NextWorkoutCard ────────────────────────────────────────────────

describe('NextWorkoutCard', () => {
  const workout = {
    id: 'w1',
    title: 'Push Day',
    exerciseCount: 4,
    estimatedDuration: 45,
  };

  it('renders null when week is complete and has a workout', () => {
    const { container } = render(
      <NextWorkoutCard workout={workout} isWeekComplete={true} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows "Up Next" and workout title when week is incomplete', () => {
    render(<NextWorkoutCard workout={workout} isWeekComplete={false} />);

    expect(screen.getByText('Up Next')).toBeInTheDocument();
    expect(screen.getByText('Push Day')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /start workout/i });
    expect(link).toHaveAttribute('href', '/session/start?workoutId=w1');
  });

  it('shows "No workouts yet" and create link when workout is null', () => {
    render(<NextWorkoutCard workout={null} isWeekComplete={false} />);

    expect(screen.getByText('No workouts yet')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /create workout/i });
    expect(link).toHaveAttribute('href', '/workout/create');
  });
});

// ─── WeekProgressCard ───────────────────────────────────────────────

describe('WeekProgressCard', () => {
  it('shows "Let\'s get moving" when zero completed', () => {
    render(
      <WeekProgressCard completed={0} planned={4} isComplete={false} />
    );
    expect(screen.getByText("Let's get moving")).toBeInTheDocument();
  });

  it('shows remaining workouts message when in progress', () => {
    render(
      <WeekProgressCard completed={2} planned={4} isComplete={false} />
    );
    expect(screen.getByText(/2 more workouts to level up/)).toBeInTheDocument();
  });

  it('shows "Week complete!" when exactly complete', () => {
    render(
      <WeekProgressCard completed={3} planned={3} isComplete={true} />
    );
    expect(screen.getByText(/Week complete!/)).toBeInTheDocument();
  });

  it('shows "Week complete! (+2)" when exceeded', () => {
    render(
      <WeekProgressCard
        completed={5}
        planned={3}
        isComplete={true}
        isExceeded={true}
        extra={2}
      />
    );
    expect(screen.getByText(/Week complete!.*\(\+2\)/)).toBeInTheDocument();
  });
});

// ─── FoxStateCard ───────────────────────────────────────────────────

describe('FoxStateCard', () => {
  it('shows "—" and "Complete your first session" when no sessions', () => {
    render(
      <FoxStateCard state={'SLIM' as any} devotionScore={null} hasNoSessions={true} />
    );
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Complete your first session')).toBeInTheDocument();
  });

  it('shows current month devotion score', () => {
    render(
      <FoxStateCard state={'FIT' as any} devotionScore={82} />
    );
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('devotion score')).toBeInTheDocument();
  });

  it('shows last month label when isLastMonth is true', () => {
    render(
      <FoxStateCard state={'STRONG' as any} devotionScore={75} isLastMonth={true} />
    );
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText(/devotion score.*last month/)).toBeInTheDocument();
  });
});

// ─── LastSessionSnapshot ────────────────────────────────────────────

describe('LastSessionSnapshot', () => {
  it('renders vibeLine and devotionScore when present', () => {
    render(
      <LastSessionSnapshot
        session={{
          id: 's1',
          workoutTitle: 'Leg Day',
          date: '2026-03-01T10:00:00Z',
          devotionScore: 91,
          vibeLine: 'Crushed it!',
        }}
      />
    );
    expect(screen.getByText('Leg Day')).toBeInTheDocument();
    expect(screen.getByText('91')).toBeInTheDocument();
    expect(screen.getByText(/Crushed it!/)).toBeInTheDocument();
  });

  it('omits vibeLine and devotionScore when null', () => {
    render(
      <LastSessionSnapshot
        session={{
          id: 's2',
          workoutTitle: 'Pull Day',
          date: '2026-03-01T10:00:00Z',
          devotionScore: null,
          vibeLine: null,
        }}
      />
    );
    expect(screen.getByText('Pull Day')).toBeInTheDocument();
    expect(screen.queryByText(/Crushed it!/)).not.toBeInTheDocument();
    // No devotion score number rendered
    expect(screen.getByText('Mar 1, 2026')).toBeInTheDocument();
  });
});
