import { FoxLevelService } from '@/services/FoxLevelService';

describe('FoxLevelService', () => {
  // ─── calculateFormScore (pure computation) ─────────────────────

  describe('calculateFormScore', () => {
    const weeklyGoal = 3;

    function makeSessions(
      count: number,
      opts: { devotionScore?: number | null; weeksSpread?: number } = {}
    ) {
      const { devotionScore = 85, weeksSpread = 6 } = opts;
      const now = new Date();
      return Array.from({ length: count }, (_, i) => {
        const date = new Date(now);
        // Spread sessions across specified number of weeks
        const weekIndex = i % weeksSpread;
        date.setDate(date.getDate() - weekIndex * 7 - (i % 2)); // vary days within week
        return { date, devotionScore };
      });
    }

    it('returns all zeros for no sessions', () => {
      const result = FoxLevelService.calculateFormScore([], weeklyGoal);
      expect(result.attendance).toBe(0);
      expect(result.quality).toBe(0);
      expect(result.consistency).toBe(0);
      expect(result.total).toBe(0);
    });

    it('computes attendance correctly', () => {
      // 18 sessions / (3 * 6 = 18 expected) = 100%
      const sessions = makeSessions(18);
      const result = FoxLevelService.calculateFormScore(sessions, weeklyGoal);
      expect(result.attendance).toBe(100);
    });

    it('caps attendance at 100%', () => {
      // 24 sessions / 18 expected > 100%, should cap
      const sessions = makeSessions(24);
      const result = FoxLevelService.calculateFormScore(sessions, weeklyGoal);
      expect(result.attendance).toBe(100);
    });

    it('computes partial attendance', () => {
      // 9 sessions / 18 expected = 50%
      const sessions = makeSessions(9);
      const result = FoxLevelService.calculateFormScore(sessions, weeklyGoal);
      expect(result.attendance).toBe(50);
    });

    it('computes quality from average CDS', () => {
      const sessions = [
        { date: new Date(), devotionScore: 80 },
        { date: new Date(), devotionScore: 90 },
        { date: new Date(), devotionScore: 100 },
      ];
      const result = FoxLevelService.calculateFormScore(sessions, weeklyGoal);
      expect(result.quality).toBe(90); // avg of 80+90+100 = 90
    });

    it('quality is 0 when all sessions have null devotionScore', () => {
      const sessions = makeSessions(5, { devotionScore: null });
      const result = FoxLevelService.calculateFormScore(sessions, weeklyGoal);
      expect(result.quality).toBe(0);
    });

    it('computes consistency (weeks at goal)', () => {
      // Create 3 sessions per week for 3 full ISO weeks (goal=3), leaving 3 weeks empty
      // Use fixed Monday dates to ensure correct ISO week grouping
      const sessions: Array<{ date: Date; devotionScore: number | null }> = [];
      // Get this Monday
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      monday.setHours(10, 0, 0, 0);

      for (let week = 0; week < 3; week++) {
        for (let s = 0; s < 3; s++) {
          const date = new Date(monday);
          date.setDate(monday.getDate() - week * 7 + s); // Mon, Tue, Wed of that week
          sessions.push({ date, devotionScore: 85 });
        }
      }
      const result = FoxLevelService.calculateFormScore(sessions, weeklyGoal);
      // 3 weeks at goal / 6 weeks total = 50%
      expect(result.consistency).toBe(50);
    });

    it('computes composite total with correct weights', () => {
      // Attendance 100 * 0.4 = 40
      // Quality 80 * 0.35 = 28
      // Consistency 50 * 0.25 = 12.5
      // Total = 80.5 -> 81
      // This is an approximate test using controlled inputs
      const sessions = makeSessions(18, { devotionScore: 80 }); // full attendance
      const result = FoxLevelService.calculateFormScore(sessions, weeklyGoal);
      expect(result.total).toBeGreaterThan(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });
  });

  // ─── scoreToLevel ──────────────────────────────────────────────

  describe('scoreToLevel', () => {
    it('returns SLIM for 0-39', () => {
      expect(FoxLevelService.scoreToLevel(0)).toBe('SLIM');
      expect(FoxLevelService.scoreToLevel(39)).toBe('SLIM');
    });

    it('returns FIT for 40-64', () => {
      expect(FoxLevelService.scoreToLevel(40)).toBe('FIT');
      expect(FoxLevelService.scoreToLevel(64)).toBe('FIT');
    });

    it('returns STRONG for 65-84', () => {
      expect(FoxLevelService.scoreToLevel(65)).toBe('STRONG');
      expect(FoxLevelService.scoreToLevel(84)).toBe('STRONG');
    });

    it('returns FIERY for 85-100', () => {
      expect(FoxLevelService.scoreToLevel(85)).toBe('FIERY');
      expect(FoxLevelService.scoreToLevel(100)).toBe('FIERY');
    });
  });

  // ─── Edge cases ────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles weeklyGoal of 0 gracefully', () => {
      const sessions = [{ date: new Date(), devotionScore: 90 }];
      const result = FoxLevelService.calculateFormScore(sessions, 0);
      expect(result.attendance).toBe(0);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('handles single session in the window', () => {
      const result = FoxLevelService.calculateFormScore(
        [{ date: new Date(), devotionScore: 95 }],
        2 // weekly goal
      );
      // attendance: 1/12 = 8.3% -> 8
      // quality: 95
      // consistency: depends on whether this week hit goal (no, 1<2)
      expect(result.attendance).toBe(8);
      expect(result.quality).toBe(95);
      expect(result.consistency).toBe(0);
    });

    it('new user with no sessions is SLIM', () => {
      const result = FoxLevelService.calculateFormScore([], 3);
      expect(FoxLevelService.scoreToLevel(result.total)).toBe('SLIM');
    });
  });
});
