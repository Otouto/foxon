import type { NarrativePlan, ChapterMemory, FoxState } from './types';
import type { ChronicleChapterContent } from '@/lib/types/chronicle';

/**
 * buildChapterMemory — extracts structured memory from plan + validated output for persistence.
 */
export function buildChapterMemory(
  plan: NarrativePlan,
  output: ChronicleChapterContent,
  ordealSessionId: string
): ChapterMemory {
  // Collect vibe lines for language vault
  const vibeLines = plan.sections.ordeal.session.vibeLine
    ? [plan.sections.ordeal.session.vibeLine]
    : [];
  if (plan.sections.ordeal.contrastSession?.vibeLine) {
    vibeLines.push(plan.sections.ordeal.contrastSession.vibeLine);
  }

  // Active threads — up to 3 narrative threads from this chapter
  const activeThreads: string[] = [];
  if (plan.sections.threshold) {
    activeThreads.push(`threshold: ${plan.sections.threshold.type}`);
  }
  if (plan.sections.earnedTruth.claim.id !== 'no_pattern') {
    activeThreads.push(`pattern: ${plan.sections.earnedTruth.claim.id}`);
  }
  if (plan.sections.carryForward) {
    activeThreads.push(`bridge: ${plan.sections.carryForward.bridge.verdict}`);
  }

  // Recent ordeal session IDs — keep last 3
  const recentOrdealSessionIds = [ordealSessionId];

  return {
    foxStateEnd: plan.numbers.foxStateEnd as FoxState,
    title: output.title,
    earnedTruth: output.earnedTruth,
    nextTest: plan.sections.nextTest.meta,
    activeThreads: activeThreads.slice(0, 3),
    userLanguageVault: vibeLines.slice(0, 5),
    recentOrdealSessionIds: recentOrdealSessionIds.slice(0, 3),
  };
}
