import { computeFoxState } from '@/lib/utils/foxState';

/**
 * computeFoxState is the single source of truth for fox state used by both
 * DashboardService (8-week window) and ChronicleDataService (monthly window).
 * Both callers pass their own totalPlanned — the logic is identical.
 */
describe('computeFoxState', () => {

  // ─── Base thresholds (no devotion modifier — null avgDevotion) ───────────

  describe('base state from session count', () => {
    it('returns SLIM for zero sessions', () => {
      expect(computeFoxState(0, 16, null)).toBe('SLIM');
    });

    it('returns FIERY immediately when sessionCount >= totalPlanned', () => {
      expect(computeFoxState(16, 16, null)).toBe('FIERY');
      expect(computeFoxState(20, 16, null)).toBe('FIERY');
    });

    it('returns SLIM for < 50% completion', () => {
      // 7/16 = 43.75%
      expect(computeFoxState(7, 16, null)).toBe('SLIM');
    });

    it('returns FIT for 50–75% completion', () => {
      // 8/16 = 50%, 11/16 = 68.75%
      expect(computeFoxState(8, 16, null)).toBe('FIT');
      expect(computeFoxState(11, 16, null)).toBe('FIT');
    });

    it('returns STRONG for 75–99% completion', () => {
      // 12/16 = 75%, 15/16 = 93.75%
      expect(computeFoxState(12, 16, null)).toBe('STRONG');
      expect(computeFoxState(15, 16, null)).toBe('STRONG');
    });
  });

  // ─── Devotion promotions (avgDevotion ≥ 90, sessionCount ≥ 4) ────────────

  describe('devotion promotion (+1 level when avg ≥ 90)', () => {
    it('promotes SLIM → FIT', () => {
      // 4/16 = 25% → SLIM base, avg 92 ≥ 90 → FIT
      expect(computeFoxState(4, 16, 92)).toBe('FIT');
    });

    it('promotes FIT → STRONG', () => {
      // 10/16 = 62.5% → FIT base
      expect(computeFoxState(10, 16, 95)).toBe('STRONG');
    });

    it('promotes STRONG → FIERY', () => {
      // 13/16 = 81.25% → STRONG base
      expect(computeFoxState(13, 16, 90)).toBe('FIERY');
    });

    it('does not promote beyond FIERY (already at 100% threshold)', () => {
      expect(computeFoxState(16, 16, 98)).toBe('FIERY');
    });
  });

  // ─── Devotion demotion (avgDevotion < 80, sessionCount ≥ 4) ─────────────

  describe('devotion demotion (-1 level when avg < 80)', () => {
    it('demotes FIT → SLIM', () => {
      expect(computeFoxState(10, 16, 75)).toBe('SLIM');
    });

    it('demotes STRONG → FIT', () => {
      expect(computeFoxState(13, 16, 70)).toBe('FIT');
    });

    it('does not demote SLIM below SLIM', () => {
      expect(computeFoxState(4, 16, 70)).toBe('SLIM');
    });
  });

  // ─── No-modifier cases ────────────────────────────────────────────────────

  describe('no devotion modifier applied', () => {
    it('does not modify when avgDevotion is in neutral range 80–89', () => {
      // FIT base stays FIT with avg 85
      expect(computeFoxState(10, 16, 85)).toBe('FIT');
    });

    it('does not apply devotion modifier when sessionCount < 4', () => {
      // Would promote if count ≥ 4, but 3 sessions → no modifier
      expect(computeFoxState(3, 16, 95)).toBe('SLIM');
    });

    it('does not apply devotion modifier when avgDevotion is null', () => {
      expect(computeFoxState(10, 16, null)).toBe('FIT');
    });
  });

  // ─── Dashboard vs Chronicle window difference ─────────────────────────────
  //
  // Same algorithm, different totalPlanned inputs produce intentionally
  // different results — this is by design, not a bug.

  describe('same algorithm, different windows (Dashboard vs Chronicle)', () => {
    it('Dashboard (8-week, totalPlanned=16): 4 sessions → FIT with high devotion', () => {
      // 4/16 = 25% → SLIM → avg 92 ≥ 90 → FIT
      expect(computeFoxState(4, 16, 92)).toBe('FIT');
    });

    it('Chronicle monthly (4-week, totalPlanned=8): 4 sessions → STRONG with high devotion', () => {
      // 4/8 = 50% → FIT → avg 92 ≥ 90 → STRONG
      expect(computeFoxState(4, 8, 92)).toBe('STRONG');
    });
  });
});
