import type { Canon, ChapterMemory, ContinuityBridge, BridgeVerdict, CheckResult } from './types';

/**
 * buildContinuityBridge — evaluates previous chapter's nextTest against current data.
 * Returns null if no previous memory or no nextTest.
 */
export function buildContinuityBridge(
  prevMemory: ChapterMemory | null,
  canon: Canon
): ContinuityBridge | null {
  if (!prevMemory?.nextTest) return null;

  const { nextTest } = prevMemory;
  const checkResults: CheckResult[] = nextTest.checks.map(check => {
    const actual = resolveMetric(check.metric, canon);
    const passed = actual !== null && evaluate(actual, check.operator, check.value);
    return { check, actual, passed };
  });

  const passCount = checkResults.filter(r => r.passed).length;
  const hasData = checkResults.some(r => r.actual !== null);

  let verdict: BridgeVerdict;
  if (!hasData) {
    verdict = 'inconclusive';
  } else if (passCount === checkResults.length) {
    verdict = 'confirmed';
  } else if (passCount === 0) {
    verdict = 'disproved';
  } else {
    verdict = 'complicated';
  }

  const summary = buildSummary(verdict, prevMemory.title, nextTest.subject, checkResults);

  return {
    previousTitle: prevMemory.title,
    previousNextTest: nextTest,
    verdict,
    checkResults,
    summary,
  };
}

function resolveMetric(metric: string, canon: Canon): number | null {
  switch (metric) {
    case 'sessionCount':
      return canon.sessionCount;
    case 'avgDevotion':
      return canon.avgDevotion;
    case 'weeklyGoalHitRate':
      return canon.hitRate;
    case 'scoreVariance':
      return canon.scoreVariance;
    case 'bestScore':
      return canon.bestScore;
    case 'worstScore':
      return canon.worstScore;
    case 'totalVolume':
      return canon.totalVolume;
    case 'longestGapDays':
      return canon.longestGapDays;
    default:
      // Pillar metrics: "avgEC", "avgSC", "avgRF", "avgLF"
      if (metric === 'avgEC') return canon.pillars.avgEC;
      if (metric === 'avgSC') return canon.pillars.avgSC;
      if (metric === 'avgRF') return canon.pillars.avgRF;
      if (metric === 'avgLF') return canon.pillars.avgLF;
      return null;
  }
}

function evaluate(actual: number, operator: string, value: number): boolean {
  switch (operator) {
    case '>=': return actual >= value;
    case '<=': return actual <= value;
    case '>': return actual > value;
    case '<': return actual < value;
    case '==': return actual === value;
    case '!=': return actual !== value;
    default: return false;
  }
}

function buildSummary(
  verdict: BridgeVerdict,
  prevTitle: string,
  subject: string,
  results: CheckResult[]
): string {
  const passCount = results.filter(r => r.passed).length;
  const total = results.length;

  switch (verdict) {
    case 'confirmed':
      return `Last chapter ("${prevTitle}") asked about ${subject} — the data confirms it (${passCount}/${total} checks passed).`;
    case 'disproved':
      return `Last chapter ("${prevTitle}") predicted ${subject} — the data says otherwise (0/${total} checks passed).`;
    case 'complicated':
      return `Last chapter ("${prevTitle}") tested ${subject} — mixed results (${passCount}/${total} checks passed).`;
    case 'inconclusive':
      return `Last chapter ("${prevTitle}") asked about ${subject} — not enough data to judge.`;
  }
}
