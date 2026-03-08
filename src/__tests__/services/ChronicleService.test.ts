// Mocks must be declared before imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    foxChronicle: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/services/ChronicleDataService', () => ({
  ChronicleDataService: {
    computeChronicleData: jest.fn(),
  },
}));

jest.mock('@/services/ChronicleGenerationService', () => ({
  ChronicleGenerationService: {
    generateChronicle: jest.fn(),
  },
}));

jest.mock('@/services/ChronicleEmailService', () => ({
  ChronicleEmailService: {
    renderEmailHtml: jest.fn().mockReturnValue('<html></html>'),
    sendChronicleEmail: jest.fn(),
  },
}));

import { ChronicleService } from '@/services/ChronicleService';
import { prisma } from '@/lib/prisma';
import { ChronicleDataService } from '@/services/ChronicleDataService';
import { ChronicleGenerationService } from '@/services/ChronicleGenerationService';
import type { ChronicleDataPayload } from '@/lib/types/chronicle';

// Minimal but valid data payload for the transformer pipeline
const mockDataPayload: ChronicleDataPayload = {
  timeFrame: {
    chapterNumber: 5,
    monthName: 'February 2026',
    month: 2,
    year: 2026,
    totalDaysInMonth: 28,
    weekCount: 4,
    weekBoundaries: [],
  },
  previousMonth: {
    sessionCount: 6,
    avgDevotion: 82,
    bestScore: 91,
    foxState: 'FIT',
    weeksAtGoal: '2 of 4',
    totalVolume: 8000,
    avgLF: 80,
  },
  currentMonth: {
    sessionCount: 8,
    avgDevotion: 85,
    bestScore: 94,
    worstScore: 78,
    foxStateStart: 'FIT',
    foxStateEnd: 'FIT',
    foxLeveledUp: false,
    weeksAtGoal: '3 of 4',
    weeklyGoal: 2,
    totalVolume: 10000,
    totalVolumeFormatted: '10.0 tonnes',
    avgLF: 82,
    avgLFGrade: 'Good',
    isNewProgram: false,
    newWorkoutTitles: [],
  },
  sessions: [
    {
      id: 'sess-1',
      date: '2026-02-03T10:00:00Z',
      dayOfWeek: 'Tuesday',
      timeOfDay: 'Morning',
      workoutTitle: 'Push Day',
      devotionScore: 85,
      devotionGrade: 'On plan',
      devotionLabel: 'On plan',
      pillars: { EC: 90, SC: 88, RF: 82, LF: 80 },
      deviations: [],
      effort: 'HARD_7',
      vibeLine: 'Pushed through the wall today',
      note: null,
      duration: 3600,
      restDaysBefore: 2,
      isComeback: false,
      weekNumber: 1,
      sessionVolume: 1200,
      exerciseLoads: [],
      heaviestLift: { exercise: 'Bench Press', load: 80, reps: 8 },
    },
    {
      id: 'sess-2',
      date: '2026-02-06T10:00:00Z',
      dayOfWeek: 'Friday',
      timeOfDay: 'Morning',
      workoutTitle: 'Pull Day',
      devotionScore: 90,
      devotionGrade: 'Dialed in',
      devotionLabel: 'Dialed in',
      pillars: { EC: 95, SC: 92, RF: 88, LF: 85 },
      deviations: [],
      effort: 'HARD_8',
      vibeLine: null,
      note: null,
      duration: 3300,
      restDaysBefore: 3,
      isComeback: false,
      weekNumber: 1,
      sessionVolume: 1400,
      exerciseLoads: [],
      heaviestLift: { exercise: 'Deadlift', load: 120, reps: 5 },
    },
  ],
  weeks: [
    {
      number: 1,
      sessionCount: 2,
      planned: 2,
      hitGoal: true,
      exceeded: false,
      avgDevotion: 87,
      bestScore: 90,
      worstScore: 85,
      scoreRange: '85 → 90',
      dominantEffort: 'Hard',
      miniArc: 'Strong week',
      totalVolume: 2600,
      avgLF: 82,
    },
    {
      number: 2,
      sessionCount: 2,
      planned: 2,
      hitGoal: true,
      exceeded: false,
      avgDevotion: 84,
      bestScore: 88,
      worstScore: 80,
      scoreRange: '80 → 88',
      dominantEffort: 'Hard',
      miniArc: 'Steady',
      totalVolume: 2500,
      avgLF: 81,
    },
    {
      number: 3,
      sessionCount: 2,
      planned: 2,
      hitGoal: true,
      exceeded: false,
      avgDevotion: 86,
      bestScore: 91,
      worstScore: 82,
      scoreRange: '82 → 91',
      dominantEffort: 'Hard',
      miniArc: 'Building',
      totalVolume: 2600,
      avgLF: 83,
    },
    {
      number: 4,
      sessionCount: 2,
      planned: 2,
      hitGoal: true,
      exceeded: false,
      avgDevotion: 83,
      bestScore: 94,
      worstScore: 78,
      scoreRange: '78 → 94',
      dominantEffort: 'Moderate',
      miniArc: 'Mixed finish',
      totalVolume: 2300,
      avgLF: 80,
    },
  ],
  pillars: {
    avgEC: 92,
    avgSC: 89,
    avgRF: 84,
    avgLF: 82,
    lfSessionCount: '8 of 8',
    strongest: 'EC',
    weakest: 'LF',
    prevAvgEC: 88,
    prevAvgSC: 86,
    prevAvgRF: 80,
    prevAvgLF: 78,
    ecDelta: 4,
    scDelta: 3,
    rfDelta: 4,
    lfDelta: 4,
  },
  exercises: [
    {
      name: 'Bench Press',
      muscleGroup: 'Chest',
      sessionCount: 4,
      peakLoad: 82.5,
      peakReps: 8,
      prevPeakLoad: 80,
      isPR: true,
      totalVolume: 3200,
      prevTotalVolume: 2800,
      volumeDelta: '+14%',
      avgLoad: 78,
      prevAvgLoad: 75,
      loadTrend: 'up',
      loadProgression: [75, 77.5, 80, 82.5],
      isBodyweight: false,
    },
  ],
  rhythm: {
    longestStreak: '3 sessions in 5 days',
    longestGap: '4 days',
    longestGapDates: 'Feb 14 → Feb 18',
    cameBackFromGap: false,
    dominantDays: 'Tuesday (4×)',
    dominantTimeOfDay: 'Morning',
    effortDistribution: { Hard: 6, Moderate: 2 },
    hardOrAbovePercent: 75,
    sessionsWithVibeLines: 5,
    calendar: '         Mon Tue Wed Thu Fri Sat Sun\nWeek 1       ●           ●           (2)',
  },
  milestones: [
    { type: 'pr', label: 'PR on Bench Press', detail: '82.5 kg × 8' },
  ],
  userName: 'TestFox',
};

// Valid V2 chapter content that the LLM would return
const mockV2Content = {
  title: 'The Quiet Return',
  verdict: 'Eight sessions averaging 85, and every week hit the goal — February was consistent yet still searching for a breakthrough.',
  carryForward: null,
  threshold: null,
  ordeal: 'Tuesday, February 3 — *Push Day*.\n\n> Pushed through the wall today\n\nScore 85 with hard effort. The vibe line says it: you showed up against resistance.',
  earnedTruth: 'Hit weekly goal 4 of 4 weeks. Rhythm consistency is established with a 100% hit rate. This is a strong pattern.',
  numbers: '| | February 2026 | January 2026 | Δ |\n|---|---|---|---|\n| Sessions | **8** of 8 | 6 | +2 |\n| Avg Devotion | **85** | 82 | +3 |\n| Fox State | **FIT** | FIT | — |',
  nextTest: 'Can the 2x/week rhythm hold for a third consecutive month? At least 6 sessions with average devotion above 80 would confirm this is your baseline.',
};

const mockExistingChronicle = { id: 'old-id' };
const mockNewChronicle = { id: 'new-id', title: 'The Quiet Return' };

describe('ChronicleService.generateAndStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Data service returns valid payload
    (ChronicleDataService.computeChronicleData as jest.Mock).mockResolvedValue(mockDataPayload);

    // No previous chapter memory
    (prisma.foxChronicle.findFirst as jest.Mock).mockResolvedValue(null);

    // No recent titles
    (prisma.foxChronicle.findMany as jest.Mock).mockResolvedValue([]);

    // LLM returns valid V2 content
    (ChronicleGenerationService.generateChronicle as jest.Mock).mockResolvedValue({
      title: mockV2Content.title,
      contentMd: JSON.stringify(mockV2Content),
    });

    // DB create returns the new chronicle
    (prisma.foxChronicle.create as jest.Mock).mockResolvedValue(mockNewChronicle);
  });

  describe('regeneration (existing chronicle present)', () => {
    beforeEach(() => {
      (prisma.foxChronicle.findUnique as jest.Mock).mockResolvedValue(mockExistingChronicle);
      (prisma.foxChronicle.delete as jest.Mock).mockResolvedValue(undefined);
    });

    it('does not delete the old record before AI generation completes', async () => {
      let deleteCalledBeforeGenerate = false;

      (ChronicleGenerationService.generateChronicle as jest.Mock).mockImplementation(async () => {
        deleteCalledBeforeGenerate =
          (prisma.foxChronicle.delete as jest.Mock).mock.calls.length > 0;
        return { title: mockV2Content.title, contentMd: JSON.stringify(mockV2Content) };
      });

      await ChronicleService.generateAndStore('user-123', 2, 2026);

      expect(deleteCalledBeforeGenerate).toBe(false);
    });

    it('deletes the old record after AI generation succeeds', async () => {
      await ChronicleService.generateAndStore('user-123', 2, 2026);

      const deleteCalls = (prisma.foxChronicle.delete as jest.Mock).mock.invocationCallOrder[0];
      const createCalls = (prisma.foxChronicle.create as jest.Mock).mock.invocationCallOrder[0];

      expect(prisma.foxChronicle.delete).toHaveBeenCalledWith({
        where: { id: 'old-id' },
      });
      // delete must happen strictly before create
      expect(deleteCalls).toBeLessThan(createCalls);
    });

    it('does NOT delete the old record when AI generation throws', async () => {
      (ChronicleGenerationService.generateChronicle as jest.Mock).mockRejectedValue(
        new Error('Claude API unavailable')
      );

      await expect(
        ChronicleService.generateAndStore('user-123', 2, 2026)
      ).rejects.toThrow('Claude API unavailable');

      expect(prisma.foxChronicle.delete).not.toHaveBeenCalled();
    });
  });

  describe('first generation (no existing chronicle)', () => {
    beforeEach(() => {
      (prisma.foxChronicle.findUnique as jest.Mock).mockResolvedValue(null);
    });

    it('creates the new chronicle without calling delete', async () => {
      const result = await ChronicleService.generateAndStore('user-123', 2, 2026);

      expect(prisma.foxChronicle.delete).not.toHaveBeenCalled();
      expect(prisma.foxChronicle.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 'new-id', title: 'The Quiet Return' });
    });

    it('persists chapterMemory in the create call', async () => {
      await ChronicleService.generateAndStore('user-123', 2, 2026);

      const createCall = (prisma.foxChronicle.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.chapterMemory).toBeDefined();

      const memory = createCall.data.chapterMemory;
      expect(memory.foxStateEnd).toBe('FIT');
      expect(memory.title).toBe('The Quiet Return');
      expect(memory.nextTest).toBeDefined();
      expect(memory.nextTest.checks.length).toBeGreaterThan(0);
    });

    it('injects rhythmCalendar from dataPayload into contentMd', async () => {
      await ChronicleService.generateAndStore('user-123', 2, 2026);

      const createCall = (prisma.foxChronicle.create as jest.Mock).mock.calls[0][0];
      const stored = JSON.parse(createCall.data.contentMd);
      expect(stored.rhythmCalendar).toBe(mockDataPayload.rhythm.calendar);
    });

    it('passes NarrativePlan (not raw data) to generateChronicle', async () => {
      await ChronicleService.generateAndStore('user-123', 2, 2026);

      const genCall = (ChronicleGenerationService.generateChronicle as jest.Mock).mock.calls[0][0];
      // NarrativePlan has chapter, numbers, sections, style
      expect(genCall.chapter).toBeDefined();
      expect(genCall.chapter.number).toBe(5);
      expect(genCall.numbers).toBeDefined();
      expect(genCall.sections).toBeDefined();
      expect(genCall.sections.verdict).toBeDefined();
      expect(genCall.sections.ordeal).toBeDefined();
      expect(genCall.sections.earnedTruth).toBeDefined();
      expect(genCall.sections.nextTest).toBeDefined();
      expect(genCall.style).toBeDefined();
    });
  });

  describe('continuity bridge', () => {
    it('fetches previous chapter memory for bridge evaluation', async () => {
      (prisma.foxChronicle.findUnique as jest.Mock).mockResolvedValue(null);

      await ChronicleService.generateAndStore('user-123', 2, 2026);

      // Should query for January 2026 chapter memory
      expect(prisma.foxChronicle.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-123', month: 1, year: 2026 },
        select: { chapterMemory: true },
      });
    });

    it('wraps around to December of previous year for January', async () => {
      (prisma.foxChronicle.findUnique as jest.Mock).mockResolvedValue(null);

      await ChronicleService.generateAndStore('user-123', 1, 2026);

      expect(prisma.foxChronicle.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-123', month: 12, year: 2025 },
        select: { chapterMemory: true },
      });
    });

    it('includes carryForward when previous memory has nextTest', async () => {
      (prisma.foxChronicle.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.foxChronicle.findFirst as jest.Mock).mockResolvedValue({
        chapterMemory: {
          foxStateEnd: 'FIT',
          title: 'Previous Chapter',
          earnedTruth: 'Some truth',
          nextTest: {
            subject: 'rhythm_consistency',
            kind: 'consistency',
            hypothesis: '2x/week will hold',
            checks: [
              { metric: 'sessionCount', operator: '>=', value: 6, label: 'At least 6 sessions' },
            ],
          },
          activeThreads: [],
          userLanguageVault: [],
          recentOrdealSessionIds: [],
        },
      });

      await ChronicleService.generateAndStore('user-123', 2, 2026);

      const genCall = (ChronicleGenerationService.generateChronicle as jest.Mock).mock.calls[0][0];
      expect(genCall.sections.carryForward).not.toBeNull();
      expect(genCall.sections.carryForward.bridge.verdict).toBe('confirmed');
    });
  });
});
