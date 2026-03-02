/**
 * Shared fox state computation — single source of truth for both the
 * live Dashboard (8-week rolling window) and the Chronicle (monthly window).
 *
 * The caller is responsible for choosing the window:
 *   Dashboard:  totalPlanned = weeklyGoal * 8
 *   Chronicle:  totalPlanned = weeklyGoal * weeksInMonth
 */
export function computeFoxState(
  sessionCount: number,
  totalPlanned: number,
  avgDevotion: number | null
): 'SLIM' | 'FIT' | 'STRONG' | 'FIERY' {
  if (sessionCount === 0) return 'SLIM';
  if (sessionCount >= totalPlanned) return 'FIERY';

  let base: 'SLIM' | 'FIT' | 'STRONG' | 'FIERY';
  if (sessionCount < totalPlanned * 0.5) {
    base = 'SLIM';
  } else if (sessionCount < totalPlanned * 0.75) {
    base = 'FIT';
  } else {
    base = 'STRONG';
  }

  // Devotion modifier requires at least 4 sessions of data
  if (sessionCount >= 4 && avgDevotion !== null) {
    const order: Array<'SLIM' | 'FIT' | 'STRONG' | 'FIERY'> = ['SLIM', 'FIT', 'STRONG', 'FIERY'];
    const idx = order.indexOf(base);
    if (avgDevotion >= 90 && idx < 3) return order[idx + 1];
    if (avgDevotion < 80 && idx > 0) return order[idx - 1];
  }

  return base;
}
