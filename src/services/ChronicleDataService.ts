import { prisma } from '@/lib/prisma';
import { SessionStatus } from '@prisma/client';
import { getPracticeTimeInfo, getDevotionScoreLabel, getWeekBounds, mergePartialBoundaryWeeks } from '@/lib/utils/dateUtils';
import type {
  ChronicleDataPayload,
  ChronicleTimeFrame,
  ChroniclePreviousMonth,
  ChronicleCurrentMonth,
  ChronicleSessionData,
  ChronicleWeekData,
  ChroniclePillarAnalysis,
  ChronicleExerciseInsight,
  ChronicleRhythm,
  ChronicleMilestone,
} from '@/lib/types/chronicle';

// Raw session type from Prisma query
interface RawSession {
  id: string;
  date: Date;
  duration: number | null;
  devotionScore: number | null;
  devotionGrade: string | null;
  devotionPillars: unknown;
  devotionDeviations: unknown;
  workout: { title: string } | null;
  sessionSeal: {
    effort: string;
    vibeLine: string;
    note: string | null;
  } | null;
  sessionExercises: Array<{
    exercise: {
      name: string;
      muscleGroup: { name: string } | null;
    };
    sessionSets: Array<{
      load: unknown; // Decimal
      reps: number;
      completed: boolean;
      type: string;
    }>;
  }>;
}

interface Pillars {
  EC: number;
  SC: number;
  RF: number;
  LF?: number;
}

const EFFORT_HARD_THRESHOLD = ['HARD_7', 'HARD_8', 'ALL_OUT_9', 'ALL_OUT_10'];
const EFFORT_LABELS: Record<string, string> = {
  EASY_1: 'Easy', EASY_2: 'Easy', EASY_3: 'Easy',
  MODERATE_4: 'Steady', MODERATE_5: 'Steady', MODERATE_6: 'Steady',
  HARD_7: 'Hard', HARD_8: 'Hard',
  ALL_OUT_9: 'All-In', ALL_OUT_10: 'All-Out',
};

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export class ChronicleDataService {
  /**
   * Compute the full chronicle data payload for a given user/month
   */
  static async computeChronicleData(
    userId: string,
    month: number,
    year: number
  ): Promise<ChronicleDataPayload> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Date boundaries
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
    const prevMonthStart = new Date(year, month - 2, 1);
    const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);

    // Fetch current and previous month sessions with full relations
    const [currentSessions, prevSessions, allTimeSessions, prevChapter] = await Promise.all([
      this.fetchSessions(userId, monthStart, monthEnd),
      this.fetchSessions(userId, prevMonthStart, prevMonthEnd),
      this.fetchAllSessionsBefore(userId, monthStart),
      this.fetchPreviousChapterMemory(userId, month, year),
    ]);

    const weeklyGoal = user.weeklyGoal;
    // Fox state from previous chapter memory (if exists)
    const prevFoxState = prevChapter?.foxStateEnd || 'SLIM';

    // Compute all sections
    const timeFrame = this.computeTimeFrame(month, year, userId, allTimeSessions, currentSessions);
    const previousMonth = prevSessions.length > 0
      ? this.computePreviousMonth(prevSessions, weeklyGoal, prevMonthStart, prevMonthEnd, prevFoxState)
      : null;
    const sessions = this.computeSessionData(currentSessions, monthStart);
    const weeks = this.computeWeekData(currentSessions, monthStart, monthEnd, weeklyGoal);
    const currentMonth = this.computeCurrentMonth(currentSessions, weeks, weeklyGoal, previousMonth, allTimeSessions, user.foxLevel);
    const pillars = this.computePillarAnalysis(currentSessions, prevSessions);
    const exercises = this.computeExerciseInsights(currentSessions, prevSessions, allTimeSessions);
    const rhythm = this.computeRhythm(currentSessions);
    const milestones = this.computeMilestones(currentSessions, previousMonth, weeks, exercises, allTimeSessions, user.foxLevel);

    return {
      timeFrame: {
        ...timeFrame,
        chapterNumber: this.computeChapterNumber(userId, allTimeSessions, monthStart),
      },
      previousMonth,
      currentMonth,
      sessions,
      weeks,
      pillars,
      exercises,
      rhythm,
      milestones,
      userName: user.displayName || 'Fox',
    };
  }

  // ─── Data Fetching ────────────────────────────────────────────

  private static async fetchSessions(
    userId: string, start: Date, end: Date
  ): Promise<RawSession[]> {
    return prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.FINISHED,
        date: { gte: start, lte: end },
      },
      include: {
        workout: { select: { title: true } },
        sessionSeal: { select: { effort: true, vibeLine: true, note: true } },
        sessionExercises: {
          include: {
            exercise: {
              select: {
                name: true,
                muscleGroup: { select: { name: true } },
              },
            },
            sessionSets: {
              select: { load: true, reps: true, completed: true, type: true },
              where: { completed: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    }) as unknown as RawSession[];
  }

  private static async fetchAllSessionsBefore(
    userId: string, before: Date
  ): Promise<RawSession[]> {
    return prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.FINISHED,
        date: { lt: before },
      },
      include: {
        workout: { select: { title: true } },
        sessionSeal: { select: { effort: true, vibeLine: true, note: true } },
        sessionExercises: {
          include: {
            exercise: {
              select: {
                name: true,
                muscleGroup: { select: { name: true } },
              },
            },
            sessionSets: {
              select: { load: true, reps: true, completed: true, type: true },
              where: { completed: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    }) as unknown as RawSession[];
  }

  private static async fetchPreviousChapterMemory(
    userId: string, month: number, year: number
  ): Promise<{ foxStateEnd: string } | null> {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevChronicle = await prisma.foxChronicle.findFirst({
      where: { userId, month: prevMonth, year: prevYear },
      select: { chapterMemory: true },
    });
    if (!prevChronicle?.chapterMemory) return null;
    const memory = prevChronicle.chapterMemory as Record<string, unknown>;
    return { foxStateEnd: (memory.foxStateEnd as string) || 'SLIM' };
  }

  // ─── Section 1: Time Frame ────────────────────────────────────

  private static computeTimeFrame(
    month: number, year: number, _userId: string,
    _allTimeSessions: RawSession[], _currentSessions: RawSession[]
  ): ChronicleTimeFrame {
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    // Compute week boundaries (Mon-Sun) that overlap with this month
    const weekBoundaries: Array<{ start: Date; end: Date }> = [];
    const seen = new Set<string>();
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const wb = getWeekBounds(date);
      const key = wb.start.toISOString();
      if (!seen.has(key)) {
        seen.add(key);
        weekBoundaries.push(wb);
      }
    }

    return {
      month,
      year,
      chapterNumber: 0, // Set later
      totalDaysInMonth,
      weekCount: weekBoundaries.length,
      weekBoundaries,
      monthName: `${MONTH_NAMES[month]} ${year}`,
    };
  }

  private static computeChapterNumber(
    _userId: string, allTimeSessions: RawSession[], monthStart: Date
  ): number {
    if (allTimeSessions.length === 0) return 1;
    const firstSession = allTimeSessions[0];
    const firstMonth = new Date(firstSession.date.getFullYear(), firstSession.date.getMonth(), 1);
    const months = (monthStart.getFullYear() - firstMonth.getFullYear()) * 12
      + (monthStart.getMonth() - firstMonth.getMonth()) + 1;
    return Math.max(1, months);
  }

  // ─── Section 2: Previous Month ────────────────────────────────

  private static computePreviousMonth(
    sessions: RawSession[], weeklyGoal: number,
    monthStart: Date, monthEnd: Date,
    foxState: string
  ): ChroniclePreviousMonth {
    const scores = sessions.map(s => s.devotionScore).filter((s): s is number => s !== null);
    const volume = this.computeTotalVolume(sessions);
    const lfValues = sessions
      .map(s => this.parsePillars(s.devotionPillars)?.LF)
      .filter((v): v is number => v !== undefined && v !== null);

    // Compute weeks at goal
    const weekBounds: Array<{ start: Date; end: Date }> = [];
    const seen = new Set<string>();
    const totalDays = monthEnd.getDate();
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), d);
      const wb = getWeekBounds(date);
      const key = wb.start.toISOString();
      if (!seen.has(key)) {
        seen.add(key);
        weekBounds.push(wb);
      }
    }
    let weeksHit = 0;
    for (const wb of weekBounds) {
      const weekSessions = sessions.filter(s => s.date >= wb.start && s.date <= wb.end);
      if (weekSessions.length >= weeklyGoal) weeksHit++;
    }

    return {
      sessionCount: sessions.length,
      avgDevotion: scores.length > 0 ? Math.round(avg(scores)) : null,
      bestScore: scores.length > 0 ? Math.max(...scores) : null,
      foxState,  // now passed as parameter, read from DB
      weeksAtGoal: `${weeksHit} of ${weekBounds.length}`,
      totalVolume: Math.round(volume),
      avgLF: lfValues.length > 0 ? round2(avg(lfValues)) : null,
    };
  }

  // ─── Section 3: Current Month ─────────────────────────────────

  private static computeCurrentMonth(
    sessions: RawSession[],
    weeks: ChronicleWeekData[],
    weeklyGoal: number,
    prev: ChroniclePreviousMonth | null,
    priorSessions: RawSession[],
    foxLevel: string
  ): ChronicleCurrentMonth {
    const scores = sessions.map(s => s.devotionScore).filter((s): s is number => s !== null);
    const volume = this.computeTotalVolume(sessions);
    const lfValues = sessions
      .map(s => this.parsePillars(s.devotionPillars)?.LF)
      .filter((v): v is number => v !== undefined && v !== null);

    const weeksHit = weeks.filter(w => w.hitGoal).length;
    const foxStateEnd = foxLevel;  // read from DB, single source of truth
    const foxStateStart = prev?.foxState || 'SLIM';
    const stateOrder = ['SLIM', 'FIT', 'STRONG', 'FIERY'];

    const avgLFValue = lfValues.length > 0 ? round2(avg(lfValues)) : null;

    // Detect new workout titles: appear this month but never in prior sessions
    const priorTitles = new Set(
      priorSessions.map(s => s.workout?.title).filter((t): t is string => !!t)
    );
    const newWorkoutTitles = [
      ...new Set(
        sessions
          .map(s => s.workout?.title)
          .filter((t): t is string => !!t && !priorTitles.has(t))
      ),
    ];
    const isNewProgram = newWorkoutTitles.length > 0;

    return {
      sessionCount: sessions.length,
      avgDevotion: scores.length > 0 ? Math.round(avg(scores)) : null,
      bestScore: scores.length > 0 ? Math.max(...scores) : null,
      worstScore: scores.length > 0 ? Math.min(...scores) : null,
      foxStateStart,
      foxStateEnd,
      foxLeveledUp: stateOrder.indexOf(foxStateEnd) > stateOrder.indexOf(foxStateStart),
      weeksAtGoal: `${weeksHit} of ${weeks.length}`,
      weeklyGoal,
      totalVolume: Math.round(volume),
      totalVolumeFormatted: this.formatVolume(volume),
      avgLF: avgLFValue,
      avgLFGrade: this.gradeValue(avgLFValue),
      isNewProgram,
      newWorkoutTitles,
    };
  }

  // ─── Section 4: Per-Session Data ──────────────────────────────

  private static computeSessionData(
    sessions: RawSession[], _monthStart: Date
  ): ChronicleSessionData[] {
    return sessions.map((session, index) => {
      const prevSession = index > 0 ? sessions[index - 1] : null;
      const restDaysBefore = prevSession
        ? Math.round((session.date.getTime() - prevSession.date.getTime()) / 86400000)
        : null;
      const pillars = this.parsePillars(session.devotionPillars) || { EC: 0, SC: 0, RF: 0 };
      const deviations = this.parseDeviations(session.devotionDeviations);
      const practiceTime = getPracticeTimeInfo(session.date);
      const volume = this.computeSessionVolume(session);
      const heaviest = this.computeHeaviestLift(session);

      // Week number within month (1-based)
      const dayOfMonth = session.date.getDate();
      const weekNumber = Math.ceil(dayOfMonth / 7);

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      return {
        id: session.id,
        date: session.date.toISOString(),
        dayOfWeek: dayNames[session.date.getDay()],
        timeOfDay: practiceTime.label,
        workoutTitle: session.workout?.title || null,
        devotionScore: session.devotionScore,
        devotionGrade: session.devotionGrade,
        devotionLabel: session.devotionScore ? getDevotionScoreLabel(session.devotionScore) : 'N/A',
        pillars,
        deviations,
        effort: session.sessionSeal?.effort
          ? EFFORT_LABELS[session.sessionSeal.effort] || session.sessionSeal.effort
          : null,
        vibeLine: session.sessionSeal?.vibeLine || null,
        note: session.sessionSeal?.note || null,
        duration: session.duration,
        restDaysBefore,
        isComeback: restDaysBefore !== null && restDaysBefore > 7,
        weekNumber,
        sessionVolume: Math.round(volume),
        exerciseLoads: session.sessionExercises.map(se => ({
          name: se.exercise.name,
          sets: se.sessionSets.map(ss => ({
            load: Number(ss.load),
            reps: ss.reps,
          })),
        })),
        heaviestLift: heaviest,
      };
    });
  }

  // ─── Section 5: Per-Week Aggregates ───────────────────────────

  private static computeWeekData(
    sessions: RawSession[],
    monthStart: Date, monthEnd: Date,
    weeklyGoal: number
  ): ChronicleWeekData[] {
    // Build week boundaries that overlap with this month
    const weekBounds: Array<{ start: Date; end: Date }> = [];
    const seen = new Set<string>();
    const totalDays = monthEnd.getDate();
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), d);
      const wb = getWeekBounds(date);
      const key = wb.start.toISOString();
      if (!seen.has(key)) {
        seen.add(key);
        weekBounds.push(wb);
      }
    }

    // 4-day rule: merge boundary weeks with < 4 days in the month into their
    // adjacent week (see mergePartialBoundaryWeeks in dateUtils for details).
    const mergedBounds = mergePartialBoundaryWeeks(weekBounds, monthStart, monthEnd);

    return mergedBounds.map((wb, idx) => {
      const weekSessions = sessions.filter(
        s => s.date >= wb.start && s.date <= wb.end
      );
      const scores = weekSessions.map(s => s.devotionScore).filter((s): s is number => s !== null);
      const volume = this.computeTotalVolume(weekSessions);
      const lfValues = weekSessions
        .map(s => this.parsePillars(s.devotionPillars)?.LF)
        .filter((v): v is number => v !== undefined && v !== null);

      // Dominant effort
      const effortCounts: Record<string, number> = {};
      weekSessions.forEach(s => {
        if (s.sessionSeal?.effort) {
          const label = EFFORT_LABELS[s.sessionSeal.effort] || s.sessionSeal.effort;
          effortCounts[label] = (effortCounts[label] || 0) + 1;
        }
      });
      const dominantEffort = Object.entries(effortCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      const first = scores[0] ?? null;
      const last = scores.length > 0 ? scores[scores.length - 1] : null;
      const scoreRange = first !== null && last !== null ? `${first} → ${last}` : 'N/A';

      // Mini arc
      const miniArc = this.generateMiniArc(weekSessions, weeklyGoal);

      return {
        number: idx + 1,
        sessionCount: weekSessions.length,
        planned: weeklyGoal,
        hitGoal: weekSessions.length >= weeklyGoal,
        exceeded: weekSessions.length > weeklyGoal,
        avgDevotion: scores.length > 0 ? Math.round(avg(scores)) : null,
        bestScore: scores.length > 0 ? Math.max(...scores) : null,
        worstScore: scores.length > 0 ? Math.min(...scores) : null,
        scoreRange,
        dominantEffort,
        miniArc,
        totalVolume: Math.round(volume),
        avgLF: lfValues.length > 0 ? round2(avg(lfValues)) : null,
      };
    });
  }

  // ─── Section 6: Pillar Analysis ───────────────────────────────

  private static computePillarAnalysis(
    current: RawSession[], prev: RawSession[]
  ): ChroniclePillarAnalysis {
    const computeAvgs = (sessions: RawSession[]) => {
      const ecVals: number[] = [];
      const scVals: number[] = [];
      const rfVals: number[] = [];
      const lfVals: number[] = [];
      sessions.forEach(s => {
        const p = this.parsePillars(s.devotionPillars);
        if (p) {
          ecVals.push(p.EC);
          scVals.push(p.SC);
          rfVals.push(p.RF);
          if (p.LF !== undefined) lfVals.push(p.LF);
        }
      });
      return {
        ec: ecVals.length > 0 ? round2(avg(ecVals)) : 0,
        sc: scVals.length > 0 ? round2(avg(scVals)) : 0,
        rf: rfVals.length > 0 ? round2(avg(rfVals)) : 0,
        lf: lfVals.length > 0 ? round2(avg(lfVals)) : null,
        lfCount: lfVals.length,
        total: ecVals.length,
      };
    };

    const curr = computeAvgs(current);
    const previous = prev.length > 0 ? computeAvgs(prev) : null;

    // Determine strongest/weakest
    const pillarMap: Record<string, number> = { EC: curr.ec, SC: curr.sc, RF: curr.rf };
    if (curr.lf !== null) pillarMap.LF = curr.lf;
    const sorted = Object.entries(pillarMap).sort(([, a], [, b]) => b - a);
    const strongest = sorted[0]?.[0] || 'EC';
    const weakest = sorted[sorted.length - 1]?.[0] || 'RF';

    return {
      avgEC: curr.ec,
      avgSC: curr.sc,
      avgRF: curr.rf,
      avgLF: curr.lf,
      lfSessionCount: `${curr.lfCount} of ${curr.total}`,
      strongest,
      weakest,
      prevAvgEC: previous?.ec ?? null,
      prevAvgSC: previous?.sc ?? null,
      prevAvgRF: previous?.rf ?? null,
      prevAvgLF: previous?.lf ?? null,
      ecDelta: previous ? round2(curr.ec - previous.ec) : null,
      scDelta: previous ? round2(curr.sc - previous.sc) : null,
      rfDelta: previous ? round2(curr.rf - previous.rf) : null,
      lfDelta: previous && curr.lf !== null && previous.lf !== null
        ? round2(curr.lf - previous.lf) : null,
    };
  }

  // ─── Section 7: Exercise Insights ─────────────────────────────

  private static computeExerciseInsights(
    current: RawSession[], prev: RawSession[], allTime: RawSession[]
  ): ChronicleExerciseInsight[] {
    // Build per-exercise maps
    const exerciseMap = new Map<string, {
      name: string;
      muscleGroup: string | null;
      currentSessions: Array<{ loads: number[]; reps: number[]; volume: number }>;
      prevSessions: Array<{ loads: number[]; reps: number[]; volume: number }>;
      allTimePeakLoad: number;
    }>();

    const processSession = (
      sessions: RawSession[],
      target: 'currentSessions' | 'prevSessions'
    ) => {
      for (const session of sessions) {
        for (const se of session.sessionExercises) {
          const key = se.exercise.name;
          if (!exerciseMap.has(key)) {
            exerciseMap.set(key, {
              name: key,
              muscleGroup: se.exercise.muscleGroup?.name || null,
              currentSessions: [],
              prevSessions: [],
              allTimePeakLoad: 0,
            });
          }
          const entry = exerciseMap.get(key)!;
          const loads = se.sessionSets.map(ss => Number(ss.load));
          const reps = se.sessionSets.map(ss => ss.reps);
          const volume = se.sessionSets.reduce(
            (sum, ss) => sum + Number(ss.load) * ss.reps, 0
          );
          entry[target].push({ loads, reps, volume });
        }
      }
    };

    processSession(current, 'currentSessions');
    processSession(prev, 'prevSessions');

    // All-time peak loads (before this month)
    for (const session of allTime) {
      for (const se of session.sessionExercises) {
        const key = se.exercise.name;
        const entry = exerciseMap.get(key);
        if (entry) {
          for (const ss of se.sessionSets) {
            entry.allTimePeakLoad = Math.max(entry.allTimePeakLoad, Number(ss.load));
          }
        }
      }
    }

    const results: ChronicleExerciseInsight[] = [];
    for (const [, entry] of exerciseMap) {
      if (entry.currentSessions.length === 0) continue;

      const allCurrentLoads = entry.currentSessions.flatMap(s => s.loads);
      const allCurrentReps = entry.currentSessions.flatMap(s => s.reps);
      const peakLoad = allCurrentLoads.length > 0 ? Math.max(...allCurrentLoads) : 0;
      const peakLoadIdx = allCurrentLoads.indexOf(peakLoad);
      const peakReps = peakLoadIdx >= 0 ? allCurrentReps[peakLoadIdx] : 0;

      const prevLoads = entry.prevSessions.flatMap(s => s.loads);
      const prevPeakLoad = prevLoads.length > 0 ? Math.max(...prevLoads) : null;

      const totalVolume = entry.currentSessions.reduce((s, e) => s + e.volume, 0);
      const prevTotalVolume = entry.prevSessions.length > 0
        ? entry.prevSessions.reduce((s, e) => s + e.volume, 0)
        : null;

      const avgLoad = allCurrentLoads.length > 0 ? round2(avg(allCurrentLoads)) : 0;
      const prevAvgLoad = prevLoads.length > 0 ? round2(avg(prevLoads)) : null;

      // Load progression: average load per session, in chronological order
      const loadProgression = entry.currentSessions.map(s =>
        s.loads.length > 0 ? round2(avg(s.loads)) : 0
      );

      const loadTrend: 'up' | 'stable' | 'down' =
        prevAvgLoad === null ? 'stable'
          : avgLoad > prevAvgLoad * 1.05 ? 'up'
            : avgLoad < prevAvgLoad * 0.95 ? 'down'
              : 'stable';

      const volumeDelta = prevTotalVolume !== null && prevTotalVolume > 0
        ? `${Math.round(((totalVolume - prevTotalVolume) / prevTotalVolume) * 100)}%`
        : null;

      const isBodyweight = allCurrentLoads.every(l => l === 0);
      const isPR = peakLoad > entry.allTimePeakLoad && peakLoad > 0;

      results.push({
        name: entry.name,
        muscleGroup: entry.muscleGroup,
        sessionCount: entry.currentSessions.length,
        peakLoad,
        peakReps,
        prevPeakLoad,
        isPR,
        totalVolume: Math.round(totalVolume),
        prevTotalVolume: prevTotalVolume !== null ? Math.round(prevTotalVolume) : null,
        volumeDelta: volumeDelta ? (totalVolume >= (prevTotalVolume || 0) ? `+${volumeDelta}` : volumeDelta) : null,
        avgLoad,
        prevAvgLoad,
        loadTrend,
        loadProgression,
        isBodyweight,
      });
    }

    return results.sort((a, b) => b.sessionCount - a.sessionCount);
  }

  // ─── Section 8: Rhythm & Patterns ─────────────────────────────

  private static computeRhythm(sessions: RawSession[]): ChronicleRhythm {
    if (sessions.length === 0) {
      return {
        longestStreak: 'No sessions',
        longestGap: 'N/A',
        longestGapDates: 'N/A',
        cameBackFromGap: false,
        dominantDays: 'N/A',
        dominantTimeOfDay: 'N/A',
        effortDistribution: {},
        hardOrAbovePercent: 0,
        sessionsWithVibeLines: 0,
        calendar: '',
      };
    }

    // Longest streak (consecutive sessions with ≤2 day gaps)
    let maxStreak = 1;
    let currentStreak = 1;
    let streakDays = 0;
    let maxStreakDays = 0;
    for (let i = 1; i < sessions.length; i++) {
      const gap = Math.round(
        (sessions[i].date.getTime() - sessions[i - 1].date.getTime()) / 86400000
      );
      if (gap <= 2) {
        currentStreak++;
        streakDays += gap;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          maxStreakDays = streakDays;
        }
      } else {
        currentStreak = 1;
        streakDays = 0;
      }
    }

    // Longest gap
    let maxGap = 0;
    let gapStart: Date | null = null;
    let gapEnd: Date | null = null;
    for (let i = 1; i < sessions.length; i++) {
      const gap = Math.round(
        (sessions[i].date.getTime() - sessions[i - 1].date.getTime()) / 86400000
      );
      if (gap > maxGap) {
        maxGap = gap;
        gapStart = sessions[i - 1].date;
        gapEnd = sessions[i].date;
      }
    }

    // Dominant days
    const dayCounts: Record<string, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    sessions.forEach(s => {
      const day = dayNames[s.date.getDay()];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const topDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0];

    // Dominant time of day
    const timeCounts: Record<string, number> = {};
    sessions.forEach(s => {
      const info = getPracticeTimeInfo(s.date);
      timeCounts[info.label] = (timeCounts[info.label] || 0) + 1;
    });
    const topTime = Object.entries(timeCounts).sort(([, a], [, b]) => b - a)[0];

    // Effort distribution
    const effortDist: Record<string, number> = {};
    let hardCount = 0;
    sessions.forEach(s => {
      if (s.sessionSeal?.effort) {
        const label = EFFORT_LABELS[s.sessionSeal.effort] || s.sessionSeal.effort;
        effortDist[label] = (effortDist[label] || 0) + 1;
        if (EFFORT_HARD_THRESHOLD.includes(s.sessionSeal.effort)) {
          hardCount++;
        }
      }
    });

    const vibeLineCount = sessions.filter(s => s.sessionSeal?.vibeLine).length;

    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Build rhythm calendar grid
    const calendar = this.buildRhythmCalendar(sessions);

    return {
      longestStreak: `${maxStreak} session${maxStreak > 1 ? 's' : ''} in ${maxStreakDays + 1} days`,
      longestGap: maxGap > 0 ? `${maxGap} days` : 'N/A',
      longestGapDates: gapStart && gapEnd ? `${fmt(gapStart)} → ${fmt(gapEnd)}` : 'N/A',
      cameBackFromGap: gapEnd !== null && sessions.some(s => s.date > gapEnd!),
      dominantDays: topDay ? `${topDay[0]} (${topDay[1]}×)` : 'N/A',
      dominantTimeOfDay: topTime ? topTime[0] : 'N/A',
      effortDistribution: effortDist,
      hardOrAbovePercent: sessions.length > 0
        ? Math.round((hardCount / sessions.length) * 100)
        : 0,
      sessionsWithVibeLines: vibeLineCount,
      calendar,
    };
  }

  /**
   * Build a rhythm calendar like:
   *          Mon  Tue  Wed  Thu  Fri  Sat  Sun
   * Week 1    ●              ●                     2 of 2 ✓
   * Week 2         ●         ●         ●           3 of 2 ✓✓
   */
  private static buildRhythmCalendar(sessions: RawSession[]): string {
    if (sessions.length === 0) return '';

    // Get month boundaries from first session
    const firstDate = sessions[0].date;
    const month = firstDate.getMonth();
    const year = firstDate.getFullYear();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Build set of session dates (day-of-month)
    const sessionDates = new Set<number>();
    sessions.forEach(s => {
      if (s.date.getMonth() === month && s.date.getFullYear() === year) {
        sessionDates.add(s.date.getDate());
      }
    });

    // Build week rows (Mon-Sun)
    const weekRows: Array<{ daySlots: (boolean | null)[]; count: number }> = [];
    let currentWeek: (boolean | null)[] = [null, null, null, null, null, null, null];
    let weekSessionCount = 0;

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = (date.getDay() + 6) % 7; // Mon=0, Sun=6

      // Start new week row if we're on Monday and not day 1
      if (dayOfWeek === 0 && d > 1) {
        weekRows.push({ daySlots: currentWeek, count: weekSessionCount });
        currentWeek = [null, null, null, null, null, null, null];
        weekSessionCount = 0;
      }

      const hasSession = sessionDates.has(d);
      currentWeek[dayOfWeek] = hasSession;
      if (hasSession) weekSessionCount++;
    }
    // Push final week
    weekRows.push({ daySlots: currentWeek, count: weekSessionCount });

    // Get weekly goal from first session's user (we'll use it from the context)
    // For now we pass it through — but actually we need the weeklyGoal here
    // We'll get it from the caller. For now, compute without goal reference.

    // Render
    const header = '         Mon  Tue  Wed  Thu  Fri  Sat  Sun';
    const lines = [header];

    // Rows with fewer than 4 in-month days are partial boundary weeks (e.g. a
    // month that starts on Sunday gives a 1-day first row). These get a blank
    // label so week numbering stays consistent with the narrative.
    const MIN_DAYS_FOR_WEEK_LABEL = 4;
    let weekNumber = 0;
    weekRows.forEach((week) => {
      const inMonthDays = week.daySlots.filter(s => s !== null).length;
      const isPartial = inMonthDays < MIN_DAYS_FOR_WEEK_LABEL;
      if (!isPartial) weekNumber++;
      const weekLabel = isPartial ? '         ' : `Week ${weekNumber}`.padEnd(9);
      const slots = week.daySlots.map(slot => {
        if (slot === null) return '    '; // Day not in this month
        return slot ? '  ● ' : '    ';
      }).join('');
      const countStr = `${week.count}`;
      lines.push(`${weekLabel}${slots}   ${countStr} session${week.count !== 1 ? 's' : ''}`);
    });

    return lines.join('\n');
  }

  // ─── Section 9: Milestones ────────────────────────────────────

  private static computeMilestones(
    sessions: RawSession[],
    prev: ChroniclePreviousMonth | null,
    weeks: ChronicleWeekData[],
    exercises: ChronicleExerciseInsight[],
    _allTime: RawSession[],
    foxLevel: string
  ): ChronicleMilestone[] {
    const milestones: ChronicleMilestone[] = [];
    if (sessions.length === 0) return milestones;

    // Best & worst sessions
    const scored = sessions.filter(s => s.devotionScore !== null);
    if (scored.length > 0) {
      const best = scored.reduce((a, b) =>
        (b.devotionScore || 0) > (a.devotionScore || 0) ? b : a
      );
      milestones.push({
        type: 'monthBestSession',
        label: 'Month best session',
        detail: `Score ${best.devotionScore} on ${fmtDate(best.date)}`,
        sessionId: best.id,
        date: best.date.toISOString(),
      });

      const worst = scored.reduce((a, b) =>
        (b.devotionScore || 0) < (a.devotionScore || 0) ? b : a
      );
      if (worst.id !== best.id) {
        milestones.push({
          type: 'monthWorstSession',
          label: 'Month lowest session',
          detail: `Score ${worst.devotionScore} on ${fmtDate(worst.date)}`,
          sessionId: worst.id,
          date: worst.date.toISOString(),
        });
      }
    }

    // Fox level up
    if (prev) {
      const stateOrder = ['SLIM', 'FIT', 'STRONG', 'FIERY'];
      if (stateOrder.indexOf(foxLevel) > stateOrder.indexOf(prev.foxState)) {
        milestones.push({
          type: 'foxLevelUp',
          label: 'Fox leveled up',
          detail: `${prev.foxState} → ${foxLevel}`,
        });
      }
    }

    // Perfect weeks (all sessions ≥ 90)
    weeks.forEach(w => {
      if (w.sessionCount > 0 && w.worstScore !== null && w.worstScore >= 90) {
        milestones.push({
          type: 'perfectWeek',
          label: 'Perfect week',
          detail: `Week ${w.number} — all sessions ≥ 90`,
        });
      }
    });

    // Triple weeks (3+ sessions)
    weeks.forEach(w => {
      if (w.sessionCount >= 3) {
        milestones.push({
          type: 'tripleWeek',
          label: '3+ sessions in a week',
          detail: `Week ${w.number} — ${w.sessionCount} sessions`,
        });
      }
    });

    // All weeks hit goal
    if (weeks.length > 0 && weeks.every(w => w.hitGoal)) {
      milestones.push({
        type: 'allWeeksHit',
        label: 'Every week at goal',
        detail: `${weeks.length} of ${weeks.length} weeks`,
      });
    }

    // Load PRs
    exercises.filter(e => e.isPR).forEach(e => {
      milestones.push({
        type: 'loadPR',
        label: `PR: ${e.name}`,
        detail: `${e.peakLoad}kg × ${e.peakReps} (prev best: ${e.prevPeakLoad || 'N/A'}kg)`,
      });
    });

    // Volume PR — highest single-session volume
    if (sessions.length > 0) {
      const sessionVolumes = sessions.map(s => ({
        session: s,
        volume: this.computeSessionVolume(s),
      }));
      const topVolume = sessionVolumes.reduce((a, b) => b.volume > a.volume ? b : a);
      if (topVolume.volume > 0) {
        milestones.push({
          type: 'volumePR',
          label: 'Highest session volume',
          detail: `${this.formatVolume(topVolume.volume)} on ${fmtDate(topVolume.session.date)}`,
          sessionId: topVolume.session.id,
          date: topVolume.session.date.toISOString(),
        });
      }
    }

    // Heaviest single lift of the month
    let heaviest: { exercise: string; load: number; reps: number; date: Date } | null = null;
    for (const session of sessions) {
      for (const se of session.sessionExercises) {
        for (const ss of se.sessionSets) {
          const load = Number(ss.load);
          if (!heaviest || load > heaviest.load) {
            heaviest = {
              exercise: se.exercise.name,
              load,
              reps: ss.reps,
              date: session.date,
            };
          }
        }
      }
    }
    if (heaviest && heaviest.load > 0) {
      milestones.push({
        type: 'heaviestLift',
        label: 'Heaviest lift',
        detail: `${heaviest.exercise} — ${heaviest.load}kg × ${heaviest.reps}`,
        date: heaviest.date.toISOString(),
      });
    }

    // Total volume vs prev
    if (prev && prev.totalVolume > 0) {
      const currentVolume = this.computeTotalVolume(sessions);
      const delta = Math.round(((currentVolume - prev.totalVolume) / prev.totalVolume) * 100);
      if (Math.abs(delta) >= 10) {
        milestones.push({
          type: 'totalVolumeVsPrev',
          label: 'Volume change MoM',
          detail: `${delta > 0 ? '+' : ''}${delta}% (${this.formatVolume(prev.totalVolume)} → ${this.formatVolume(currentVolume)})`,
        });
      }
    }

    return milestones;
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private static parsePillars(raw: unknown): Pillars | null {
    if (!raw || typeof raw !== 'object') return null;
    const p = raw as Record<string, number>;
    return {
      EC: p.EC ?? 0,
      SC: p.SC ?? 0,
      RF: p.RF ?? 0,
      ...(p.LF !== undefined ? { LF: p.LF } : {}),
    };
  }

  private static parseDeviations(raw: unknown): ChronicleSessionData['deviations'] {
    if (!Array.isArray(raw)) return [];
    return raw.map(d => ({
      type: d.type || '',
      exerciseName: d.exerciseName || '',
      description: d.description || '',
      impact: d.impact || 0,
    }));
  }

  private static computeSessionVolume(session: RawSession): number {
    let total = 0;
    for (const se of session.sessionExercises) {
      for (const ss of se.sessionSets) {
        total += Number(ss.load) * ss.reps;
      }
    }
    return total;
  }

  private static computeTotalVolume(sessions: RawSession[]): number {
    return sessions.reduce((sum, s) => sum + this.computeSessionVolume(s), 0);
  }

  private static computeHeaviestLift(
    session: RawSession
  ): { exercise: string; load: number; reps: number } | null {
    let heaviest: { exercise: string; load: number; reps: number } | null = null;
    for (const se of session.sessionExercises) {
      for (const ss of se.sessionSets) {
        const load = Number(ss.load);
        if (!heaviest || load > heaviest.load) {
          heaviest = { exercise: se.exercise.name, load, reps: ss.reps };
        }
      }
    }
    return heaviest && heaviest.load > 0 ? heaviest : null;
  }

  private static formatVolume(kg: number): string {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)} tonnes`;
    return `${Math.round(kg)} kg`;
  }

  private static gradeValue(val: number | null): string {
    if (val === null) return 'N/A';
    if (val >= 0.95) return 'Excellent';
    if (val >= 0.85) return 'On target';
    if (val >= 0.75) return 'Needs work';
    return 'Weak spot';
  }


  private static generateMiniArc(sessions: RawSession[], _weeklyGoal: number): string {
    if (sessions.length === 0) return 'Rest week.';
    const scores = sessions.map(s => s.devotionScore).filter((s): s is number => s !== null);
    const count = sessions.length;
    const hasPR = sessions.some(s => (s.devotionScore || 0) >= 90);

    const parts: string[] = [];
    if (count === 1) parts.push('Single session.');
    else if (count === 2) parts.push('Solid pair.');
    else parts.push(`${count} sessions.`);

    if (hasPR) parts.push('Hit 90+.');
    if (scores.length > 0) {
      const best = Math.max(...scores);
      if (best >= 95) parts.push('Peak performance.');
    }
    return parts.join(' ');
  }
}

// ─── Utility ────────────────────────────────────────────────────

function avg(xs: number[]): number {
  return xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
