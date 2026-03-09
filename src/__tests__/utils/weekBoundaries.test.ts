import { mergePartialBoundaryWeeks, getWeekBounds, WeekBounds } from '@/lib/utils/dateUtils';

/**
 * Reproduces the weekBounds array that ChronicleDataService.computeWeekData()
 * builds: one distinct Mon–Sun slot per calendar week that overlaps the month.
 */
function buildMonthWeekBounds(year: number, month: number): WeekBounds[] {
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const bounds: WeekBounds[] = [];
  const seen = new Set<string>();
  const totalDays = monthEnd.getDate();
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month - 1, d);
    const wb = getWeekBounds(date);
    const key = wb.start.toISOString();
    if (!seen.has(key)) {
      seen.add(key);
      bounds.push(wb);
    }
  }
  return bounds;
}

function monthBounds(year: number, month: number) {
  return {
    monthStart: new Date(year, month - 1, 1),
    monthEnd: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

/** How many calendar days of wb fall inside the month. */
function overlapDays(wb: WeekBounds, monthStart: Date, monthEnd: Date): number {
  const s = wb.start < monthStart ? monthStart : wb.start;
  const e = wb.end > monthEnd ? monthEnd : wb.end;
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

describe('mergePartialBoundaryWeeks', () => {

  // ─── February 2026 — starts Sunday (1-day leading partial, full trailing) ─
  //   First slot : Mon Jan 26 – Sun Feb  1 → 1 Feb day   (<4 → merge)
  //   Last  slot : Mon Feb 23 – Sun Mar  1 → 6 Feb days  (≥4 → keep)
  //   raw = 5, merged = 4

  describe('February 2026 (starts Sunday — 1-day leading partial week)', () => {
    const { monthStart, monthEnd } = monthBounds(2026, 2);
    const raw = buildMonthWeekBounds(2026, 2);

    it('raw bounds have 5 entries before merging', () => {
      expect(raw).toHaveLength(5);
    });

    it('first raw slot has exactly 1 February day', () => {
      expect(overlapDays(raw[0], monthStart, monthEnd)).toBe(1);
    });

    it('last raw slot has 6 February days (≥ threshold — no trailing merge)', () => {
      expect(overlapDays(raw[raw.length - 1], monthStart, monthEnd)).toBeGreaterThanOrEqual(4);
    });

    it('merges to 4 weeks', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd);
      expect(merged).toHaveLength(4);
    });

    it('merged Week 1 start is from the original Jan 26 slot', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd);
      // start is the Monday of the week containing Feb 1 (= Mon Jan 26 local time)
      expect(merged[0].start.getMonth()).toBe(0); // January
      expect(merged[0].start.getDate()).toBe(26);
    });

    it('merged Week 1 end is Sun Feb 8 (absorbed the second slot)', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd);
      expect(merged[0].end.getMonth()).toBe(1); // February
      expect(merged[0].end.getDate()).toBe(8);
    });

    it('remaining weeks are the original slots 3–5 (Feb 9, 16, 23)', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd);
      expect(merged[1].start.getDate()).toBe(9);
      expect(merged[2].start.getDate()).toBe(16);
      expect(merged[3].start.getDate()).toBe(23);
    });

    it('does not mutate the original array', () => {
      const snapshot = raw.map(wb => ({ start: wb.start.getTime(), end: wb.end.getTime() }));
      mergePartialBoundaryWeeks(raw, monthStart, monthEnd);
      raw.forEach((wb, i) => {
        expect(wb.start.getTime()).toBe(snapshot[i].start);
        expect(wb.end.getTime()).toBe(snapshot[i].end);
      });
    });
  });

  // ─── February 2014 — starts Saturday (2-day leading partial, 5-day trailing) ─
  //   First slot : Mon Jan 27 – Sun Feb  2 → 2 Feb days  (<4 → merge)
  //   Last  slot : Mon Feb 24 – Sun Mar  2 → 5 Feb days  (≥4 → keep)
  //   raw = 5, merged = 4

  describe('February 2014 (starts Saturday — 2-day leading partial week)', () => {
    const { monthStart, monthEnd } = monthBounds(2014, 2);
    const raw = buildMonthWeekBounds(2014, 2);

    it('first raw slot has exactly 2 February days', () => {
      expect(overlapDays(raw[0], monthStart, monthEnd)).toBe(2);
    });

    it('merges to raw.length - 1 weeks', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd);
      expect(merged).toHaveLength(raw.length - 1);
    });
  });

  // ─── January 2026 — starts Thursday (4-day leading week, exactly at threshold) ─
  //   First slot : Mon Dec 29 – Sun Jan  4 → 4 Jan days  (= 4, threshold → keep)
  //   Last  slot : Mon Jan 26 – Sun Feb  1 → 6 Jan days  (≥4 → keep)
  //   raw unchanged

  describe('January 2026 (starts Thursday — 4-day leading week, at threshold)', () => {
    const { monthStart, monthEnd } = monthBounds(2026, 1);
    const raw = buildMonthWeekBounds(2026, 1);

    it('first raw slot has exactly 4 January days', () => {
      expect(overlapDays(raw[0], monthStart, monthEnd)).toBe(4);
    });

    it('does NOT merge the first week (4 days meets the threshold)', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd);
      expect(merged).toHaveLength(raw.length);
    });
  });

  // ─── February 2021 — starts Monday (full first and last week, no merge) ───
  //   Feb 1 2021 = Monday, Feb 28 2021 = Sunday — both boundaries are full weeks
  //   raw unchanged

  describe('February 2021 (starts Monday, ends Sunday — no partial weeks)', () => {
    const { monthStart, monthEnd } = monthBounds(2021, 2);
    const raw = buildMonthWeekBounds(2021, 2);

    it('first and last slots each have 7 days in February', () => {
      expect(overlapDays(raw[0], monthStart, monthEnd)).toBe(7);
      expect(overlapDays(raw[raw.length - 1], monthStart, monthEnd)).toBe(7);
    });

    it('does not merge anything', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd);
      expect(merged).toHaveLength(raw.length);
    });
  });

  // ─── June 2020 — starts Monday (full leading, 2-day trailing partial) ────
  //   First slot: Mon Jun  1 – Sun Jun  7 → 7 Jun days (≥4 → keep)
  //   Last  slot: Mon Jun 29 – Sun Jul  5 → 2 Jun days (<4 → merge)
  //   raw = 5, merged = 4

  describe('June 2020 (starts Monday — 2-day trailing partial week)', () => {
    const { monthStart, monthEnd } = monthBounds(2020, 6);
    const raw = buildMonthWeekBounds(2020, 6);

    it('first raw slot has 7 June days (full leading week)', () => {
      expect(overlapDays(raw[0], monthStart, monthEnd)).toBe(7);
    });

    it('last raw slot has exactly 2 June days', () => {
      expect(overlapDays(raw[raw.length - 1], monthStart, monthEnd)).toBe(2);
    });

    it('merges the trailing partial into the second-to-last', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd);
      expect(merged).toHaveLength(raw.length - 1);
    });

    it('merged last week end equals the original last slot end', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd);
      const lastMerged = merged[merged.length - 1];
      const lastRaw = raw[raw.length - 1];
      expect(lastMerged.end.getTime()).toBe(lastRaw.end.getTime());
    });
  });

  // ─── October 2023 — starts Sunday AND ends Tuesday (both ends merged) ─────
  //   First slot: Mon Sep 25 – Sun Oct  1 → 1 Oct day  (<4 → merge)
  //   Last  slot: Mon Oct 30 – Sun Nov  5 → 2 Oct days (<4 → merge)
  //   raw = 6, merged = 4

  describe('October 2023 (starts Sunday AND ends Tuesday — both ends merged)', () => {
    const { monthStart, monthEnd } = monthBounds(2023, 10);
    const raw = buildMonthWeekBounds(2023, 10);

    it('first raw slot has 1 October day', () => {
      expect(overlapDays(raw[0], monthStart, monthEnd)).toBe(1);
    });

    it('last raw slot has 2 October days', () => {
      expect(overlapDays(raw[raw.length - 1], monthStart, monthEnd)).toBe(2);
    });

    it('merges both boundary weeks, reducing count by 2', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd);
      expect(merged).toHaveLength(raw.length - 2);
    });
  });

  // ─── Custom minDays override ───────────────────────────────────────────────

  describe('custom minDays override', () => {
    // Jan 2026 first slot has 4 days — exactly at the default threshold (no merge).
    // With minDays=5 the same 4-day slot falls below threshold and should merge.
    const { monthStart, monthEnd } = monthBounds(2026, 1);
    const raw = buildMonthWeekBounds(2026, 1);

    it('does NOT merge when minDays=4 (4-day slot meets threshold)', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd, 4);
      expect(merged).toHaveLength(raw.length);
    });

    it('DOES merge when minDays=5 (4-day slot is now below threshold)', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd, 5);
      expect(merged).toHaveLength(raw.length - 1);
    });
  });

  // ─── Edge: only one week bound (nothing to merge into) ────────────────────

  describe('single-week edge case', () => {
    it('returns the single entry unchanged even if it has fewer than minDays', () => {
      const { monthStart, monthEnd } = monthBounds(2026, 2);
      const singleBound = buildMonthWeekBounds(2026, 2).slice(0, 1);
      const merged = mergePartialBoundaryWeeks(singleBound, monthStart, monthEnd);
      expect(merged).toHaveLength(1);
    });
  });

  // ─── 3-day leading partial week (below threshold, should merge) ───────────
  // Need a month starting on Friday.
  // May 2020 starts on Friday.
  //   First slot: Mon Apr 27 – Sun May  3 → May 1, 2, 3 = 3 days (<4 → merge)

  describe('3-day leading partial week (< threshold, should merge)', () => {
    const { monthStart, monthEnd } = monthBounds(2020, 5); // May 2020 starts Friday
    const raw = buildMonthWeekBounds(2020, 5);

    it('first raw slot has exactly 3 May days', () => {
      expect(overlapDays(raw[0], monthStart, monthEnd)).toBe(3);
    });

    it('merges the 3-day slot (below 4-day threshold)', () => {
      const merged = mergePartialBoundaryWeeks(raw, monthStart, monthEnd);
      expect(merged.length).toBeLessThan(raw.length);
    });
  });
});
