import type { Canon, PatternClaim, ContinuityBridge, NextTestMeta, NextTestKind, NextTestCheck, NarrativePlan } from './types';

type NextTestSection = NarrativePlan['sections']['nextTest'];

/**
 * buildNextTest — picks the highest-confidence unconfirmed claim and turns it into a structured test.
 */
export function buildNextTest(
  canon: Canon,
  claims: PatternClaim[],
  _bridge: ContinuityBridge | null
): NextTestSection {
  // Find the best unconfirmed claim
  const unconfirmed = claims.filter(c => !c.isConfirmed);
  const pick = unconfirmed[0] ?? claims[0]; // Fallback to best overall

  if (!pick) {
    // No claims at all — generate a basic consistency test
    return buildFallbackTest(canon);
  }

  const meta = claimToTest(pick, canon);

  return {
    meta,
    evidence: pick.evidence,
  };
}

function claimToTest(claim: PatternClaim, canon: Canon): NextTestMeta {
  const builders: Record<string, () => NextTestMeta> = {
    rhythm_consistency: () => ({
      subject: 'rhythm_consistency',
      kind: 'consistency' as NextTestKind,
      hypothesis: `The ${canon.weeklyGoal}x/week rhythm will hold into next month`,
      checks: [
        makeCheck('sessionCount', '>=', canon.weeklyGoal * 3, `At least ${canon.weeklyGoal * 3} sessions`),
        makeCheck('weeklyGoalHitRate', '>=', 60, 'Hit rate stays above 60%'),
      ],
    }),
    score_stability: () => ({
      subject: 'score_stability',
      kind: 'consistency' as NextTestKind,
      hypothesis: 'Devotion score stability will persist',
      checks: [
        makeCheck('scoreVariance', '<=', 8, 'Score variance stays under 8'),
        makeCheck('avgDevotion', '>=', (canon.avgDevotion ?? 80) - 5, `Average stays within 5 of ${canon.avgDevotion}`),
      ],
    }),
    pillar_identity: () => ({
      subject: 'pillar_identity',
      kind: 'pillar' as NextTestKind,
      hypothesis: `${canon.pillars.strongest} pillar dominance will continue`,
      checks: [
        makeCheck(`avg${canon.pillars.strongest}`, '>=', 85, `${canon.pillars.strongest} stays above 85`),
        makeCheck(`avg${canon.pillars.weakest}`, '>=', (getPillarValue(canon.pillars.weakest, canon) ?? 70) + 3, `${canon.pillars.weakest} improves by 3+`),
      ],
    }),
    gap_recovery: () => ({
      subject: 'gap_recovery',
      kind: 'recovery' as NextTestKind,
      hypothesis: 'Recovery quality will hold without a major gap',
      checks: [
        makeCheck('longestGapDays', '<=', 7, 'No gap longer than 7 days'),
        makeCheck('avgDevotion', '>=', (canon.avgDevotion ?? 80) - 3, 'Average devotion stays close'),
      ],
    }),
    program_adaptation: () => ({
      subject: 'program_adaptation',
      kind: 'adaptation' as NextTestKind,
      hypothesis: 'New program scores will continue trending up',
      checks: [
        makeCheck('avgDevotion', '>=', (canon.avgDevotion ?? 80) + 2, 'Average improves by 2+'),
        makeCheck('sessionCount', '>=', canon.sessionCount, 'Maintains or increases session count'),
      ],
    }),
    time_of_day_pattern: () => ({
      subject: 'time_of_day_pattern',
      kind: 'rhythm' as NextTestKind,
      hypothesis: `${canon.dominantTimeOfDay} training advantage will persist`,
      checks: [
        makeCheck('sessionCount', '>=', 4, 'Enough data points'),
        makeCheck('avgDevotion', '>=', (canon.avgDevotion ?? 80), 'Overall average holds'),
      ],
    }),
    effort_score_correlation: () => ({
      subject: 'effort_score_correlation',
      kind: 'capacity' as NextTestKind,
      hypothesis: 'Effort-score relationship will remain',
      checks: [
        makeCheck('sessionCount', '>=', 6, 'Enough sessions for statistical meaning'),
        makeCheck('avgDevotion', '>=', (canon.avgDevotion ?? 80) - 3, 'Average devotion maintains'),
      ],
    }),
  };

  const builder = builders[claim.id];
  if (builder) return builder();

  // Generic fallback for unknown claim IDs
  return {
    subject: claim.id,
    kind: 'consistency',
    hypothesis: claim.claim,
    checks: [
      makeCheck('sessionCount', '>=', Math.max(4, canon.sessionCount), `At least ${Math.max(4, canon.sessionCount)} sessions`),
      makeCheck('avgDevotion', '>=', (canon.avgDevotion ?? 80) - 5, 'Average devotion holds'),
    ],
  };
}

function buildFallbackTest(canon: Canon): NextTestSection {
  const meta: NextTestMeta = {
    subject: 'baseline_consistency',
    kind: 'consistency',
    hypothesis: `Maintaining ${canon.weeklyGoal}x/week will establish a baseline`,
    checks: [
      makeCheck('sessionCount', '>=', canon.weeklyGoal * 3, `At least ${canon.weeklyGoal * 3} sessions`),
      makeCheck('avgDevotion', '>=', 75, 'Average devotion above 75'),
    ],
  };

  return {
    meta,
    evidence: [`Current session count: ${canon.sessionCount}`, `Current avg: ${canon.avgDevotion ?? 'N/A'}`],
  };
}

function makeCheck(metric: string, operator: NextTestCheck['operator'], value: number, label: string): NextTestCheck {
  return { metric, operator, value, label };
}

function getPillarValue(pillarName: string, canon: Canon): number | null {
  switch (pillarName) {
    case 'EC': return canon.pillars.avgEC;
    case 'SC': return canon.pillars.avgSC;
    case 'RF': return canon.pillars.avgRF;
    case 'LF': return canon.pillars.avgLF;
    default: return null;
  }
}
