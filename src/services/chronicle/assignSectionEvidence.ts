import type { NarrativePlan, SectionEvidence } from './types';

/**
 * assignSectionEvidence — deduplicates evidence across sections.
 * Priority: ordeal > threshold > earnedTruth > verdict > carryForward.
 * Once an evidence string is used by a higher-priority section, it's removed from lower ones.
 */
export function assignSectionEvidence(plan: NarrativePlan): SectionEvidence {
  const used = new Set<string>();

  const claim = (evidence: string[]): string[] => {
    const unique = evidence.filter(e => !used.has(e));
    unique.forEach(e => used.add(e));
    return unique;
  };

  // Claim in priority order
  const ordeal = claim(plan.sections.ordeal.evidence);
  const threshold = plan.sections.threshold ? claim(plan.sections.threshold.evidence) : [];
  const earnedTruth = claim(plan.sections.earnedTruth.evidence);
  const verdict = claim(plan.sections.verdict.evidence);
  const carryForward = plan.sections.carryForward ? claim(plan.sections.carryForward.evidence) : [];

  return { verdict, carryForward, threshold, ordeal, earnedTruth };
}
