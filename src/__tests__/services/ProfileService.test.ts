jest.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { ProfileService } from '@/services/ProfileService';
import { prisma } from '@/lib/prisma';

describe('ProfileService week streak calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockTrainingPulseQueries = (allSessions: Array<{ date: Date }>) => {
    (prisma.session.findMany as jest.Mock)
      .mockResolvedValueOnce([]) // grid sessions query
      .mockResolvedValueOnce(allSessions); // all-time sessions query for streak
    (prisma.session.count as jest.Mock).mockResolvedValue(56);
  };

  it('counts contiguous weeks including current week', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-11T12:00:00')); // Wednesday

    mockTrainingPulseQueries([
      { date: new Date('2026-03-10T10:00:00') }, // current week
      { date: new Date('2026-03-04T10:00:00') }, // previous week
      { date: new Date('2026-02-24T10:00:00') }, // 2 weeks back
    ]);

    const result = await ProfileService.getTrainingPulseData('user-1');

    expect(result.weekStreak).toBe(3);
  });

  it('keeps streak during ongoing week when no current-week session yet', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-10T12:00:00')); // Tuesday

    mockTrainingPulseQueries([
      { date: new Date('2026-03-04T10:00:00') }, // last week
      { date: new Date('2026-02-24T10:00:00') }, // 2 weeks back
      { date: new Date('2026-02-17T10:00:00') }, // 3 weeks back
    ]);

    const result = await ProfileService.getTrainingPulseData('user-1');

    expect(result.weekStreak).toBe(3);
  });

  it('resets streak after a full missed week has passed', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-16T12:00:00')); // following Monday

    mockTrainingPulseQueries([
      { date: new Date('2026-03-04T10:00:00') }, // last trained two weeks ago
      { date: new Date('2026-02-24T10:00:00') },
      { date: new Date('2026-02-17T10:00:00') },
    ]);

    const result = await ProfileService.getTrainingPulseData('user-1');

    expect(result.weekStreak).toBe(0);
  });
});
