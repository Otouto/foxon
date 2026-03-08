import type {
  Canon,
  ContinuityBridge,
  PatternClaim,
  NarrativePlan,
  FoxState,
} from './types';
import { assignSectionEvidence } from './assignSectionEvidence';

/**
 * assembleNarrativePlan — combines all transformer outputs into the final NarrativePlan.
 */
export function assembleNarrativePlan(args: {
  canon: Canon;
  bridge: ContinuityBridge | null;
  threshold: NarrativePlan['sections']['threshold'];
  ordeal: NarrativePlan['sections']['ordeal'];
  claims: PatternClaim[];
  nextTest: NarrativePlan['sections']['nextTest'];
  recentTitles: string[];
}): NarrativePlan {
  const { canon, bridge, threshold, ordeal, claims, nextTest, recentTitles } = args;

  // Build verdict section
  const verdict = buildVerdictSection(canon);

  // Build carryForward section
  const carryForward = bridge ? {
    bridge,
    evidence: bridge.checkResults.map(r =>
      `${r.check.label}: ${r.passed ? 'passed' : 'failed'} (actual: ${r.actual ?? 'N/A'})`
    ),
  } : null;

  // Build earnedTruth section — pick highest-confidence claim
  const earnedClaim = claims[0] ?? {
    id: 'no_pattern',
    claim: 'Not enough data to identify a strong pattern yet',
    evidence: [`Session count: ${canon.sessionCount}`],
    confidence: 30,
  };

  const plan: NarrativePlan = {
    chapter: {
      number: canon.timeFrame.chapterNumber,
      monthName: canon.timeFrame.monthName,
      userName: canon.userName,
    },
    numbers: {
      sessionCount: canon.sessionCount,
      monthlyTarget: canon.monthlyTarget,
      hitRate: canon.hitRate,
      avgDevotion: canon.avgDevotion,
      prevAvgDevotion: canon.previousMonth?.avgDevotion ?? null,
      prevSessionCount: canon.previousMonth?.sessionCount ?? null,
      foxStateStart: canon.foxStateStart,
      foxStateEnd: canon.foxStateEnd,
      prevFoxState: (canon.previousMonth?.foxState as FoxState) ?? null,
    },
    sections: {
      verdict,
      carryForward,
      threshold,
      ordeal,
      earnedTruth: {
        claim: earnedClaim,
        evidence: earnedClaim.evidence,
      },
      nextTest,
    },
    style: {
      recentTitles,
      bannedPhrases: buildBannedPhrases(recentTitles),
    },
  };

  // Deduplicate evidence across sections
  const deduped = assignSectionEvidence(plan);
  plan.sections.verdict.evidence = deduped.verdict;
  if (plan.sections.carryForward) plan.sections.carryForward.evidence = deduped.carryForward;
  if (plan.sections.threshold) plan.sections.threshold.evidence = deduped.threshold;
  plan.sections.ordeal.evidence = deduped.ordeal;
  plan.sections.earnedTruth.evidence = deduped.earnedTruth;

  return plan;
}

function buildVerdictSection(canon: Canon): NarrativePlan['sections']['verdict'] {
  // Dominant theme
  let dominantTheme: string;
  if (!canon.previousMonth || canon.previousMonth.sessionCount === 0) {
    dominantTheme = 'first chapter';
  } else if (canon.foxLeveledUp) {
    dominantTheme = 'level-up';
  } else if (canon.isComeback) {
    dominantTheme = 'comeback';
  } else if (canon.isNewProgram) {
    dominantTheme = 'new program';
  } else if (canon.hitRate >= 80) {
    dominantTheme = 'consistency';
  } else if (canon.hitRate < 50) {
    dominantTheme = 'sparse attendance';
  } else {
    dominantTheme = 'maintenance';
  }

  // Counterweight — always the opposite truth
  let counterweight: string;
  if (canon.hitRate >= 80 && canon.scoreVariance !== null && canon.scoreVariance > 15) {
    counterweight = 'sessions were frequent but scores varied widely';
  } else if (canon.hitRate < 50 && canon.avgDevotion !== null && canon.avgDevotion >= 85) {
    counterweight = 'sparse but every session that happened was high quality';
  } else if (canon.isComeback) {
    counterweight = 'the gap was real, but so was the return';
  } else {
    counterweight = canon.avgDevotion !== null && canon.avgDevotion >= 90
      ? 'quality was there even if quantity could improve'
      : 'consistent attendance matters more than perfect scores';
  }

  // Grounding fact — a specific number
  const groundingFact = canon.avgDevotion !== null
    ? `${canon.sessionCount} sessions averaging ${canon.avgDevotion}`
    : `${canon.sessionCount} sessions this month`;

  return {
    dominantTheme,
    counterweight,
    groundingFact,
    evidence: [
      `Sessions: ${canon.sessionCount}/${canon.monthlyTarget} (${canon.hitRate}%)`,
      `Avg devotion: ${canon.avgDevotion ?? 'N/A'}`,
      `Fox state: ${canon.foxStateStart} → ${canon.foxStateEnd}`,
      `Score range: ${canon.worstScore ?? 'N/A'} → ${canon.bestScore ?? 'N/A'}`,
    ],
  };
}

function buildBannedPhrases(recentTitles: string[]): string[] {
  const base = [
    'journey', 'frontier', 'chapter of your life', 'next level',
    'dedication', 'you should be proud', 'keep going', 'keep it up',
    'quiet month', 'steady dedication',
  ];

  // Ban words from recent titles to avoid repetition
  const titleWords = recentTitles
    .flatMap(t => t.toLowerCase().split(/\s+/))
    .filter(w => w.length > 3);
  const uniqueTitleWords = [...new Set(titleWords)];

  return [...base, ...uniqueTitleWords];
}
