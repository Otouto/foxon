import { render, screen } from '@testing-library/react';

// Mock next/link as a simple <a> passthrough
jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
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

// Mock date helpers to return predictable strings
jest.mock('@/lib/utils/dateUtils', () => ({
  formatDate: () => 'Mar 1, 2026',
  getDaysAgoLabel: () => '2d ago',
}));

import { ProgressionState } from '@prisma/client';
import { WeekProgressCard } from '@/components/dashboard/WeekProgressCard';
import { FoxStateCard } from '@/components/dashboard/FoxStateCard';
import { LastSessionSnapshot } from '@/components/dashboard/LastSessionSnapshot';

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

const defaultBreakdown = { attendance: 58, quality: 94, consistency: 17 };

describe('FoxStateCard', () => {
  it('shows the formScore and "form score · 6 weeks" label', () => {
    render(
      <FoxStateCard
        state={'FIT' as ProgressionState}
        formScore={60}
        formScoreBreakdown={defaultBreakdown}
      />
    );
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('form score · 6 weeks')).toBeInTheDocument();
  });

  it('shows the Fox State label', () => {
    render(
      <FoxStateCard
        state={'STRONG' as ProgressionState}
        formScore={72}
        formScoreBreakdown={defaultBreakdown}
      />
    );
    expect(screen.getByText('STRONG')).toBeInTheDocument();
  });

  it('renders all three pillar labels', () => {
    render(
      <FoxStateCard
        state={'FIT' as ProgressionState}
        formScore={60}
        formScoreBreakdown={defaultBreakdown}
      />
    );
    expect(screen.getByText('Attendance')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Consistency')).toBeInTheDocument();
  });

  it('renders numeric pillar values', () => {
    render(
      <FoxStateCard
        state={'FIT' as ProgressionState}
        formScore={60}
        formScoreBreakdown={defaultBreakdown}
      />
    );
    expect(screen.getByText('58')).toBeInTheDocument();
    expect(screen.getByText('94')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
  });

  it('links to profile page', () => {
    render(
      <FoxStateCard
        state={'FIT' as ProgressionState}
        formScore={60}
        formScoreBreakdown={defaultBreakdown}
      />
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/profile');
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
    expect(screen.getByText('2d ago')).toBeInTheDocument();
  });
});
