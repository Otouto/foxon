import type { Canon, CanonSession, ChapterMemory, NarrativePlan } from './types';

type OrdealSection = NarrativePlan['sections']['ordeal'];

/**
 * rankOrdealSessions — picks the single best ordeal session.
 * Scoring: vibe line (+10), comeback (+5), high effort (+2),
 * score extremes (+3), NOT previous ordeal (-20).
 */
export function rankOrdealSessions(
  canon: Canon,
  prevMemory: ChapterMemory | null
): OrdealSection {
  const recentOrdealIds = new Set(prevMemory?.recentOrdealSessionIds ?? []);

  const scored = canon.sessions.map(session => {
    let score = 0;

    // Vibe line present
    if (session.vibeLine) score += 10;

    // Comeback session
    if (session.isComeback) score += 5;

    // High effort
    if (session.effort && ['HARD_7', 'HARD_8', 'ALL_OUT_9', 'ALL_OUT_10'].includes(session.effort)) {
      score += 2;
    }

    // Score extremes (best or worst of the month)
    if (session.devotionScore !== null) {
      if (session.devotionScore === canon.bestScore) score += 3;
      if (session.devotionScore === canon.worstScore) score += 3;
    }

    // Penalize if it was a recent ordeal
    if (recentOrdealIds.has(session.id)) score -= 20;

    return { session, score };
  });

  // Sort by score descending, pick highest
  scored.sort((a, b) => b.score - a.score);
  const picked = scored[0]?.session ?? canon.sessions[0];

  // Find a contrast session if it sharpens the point
  const contrastSession = findContrast(picked, canon.sessions);

  const reason = buildReason(picked, canon);

  return {
    session: picked,
    reason,
    contrastSession: contrastSession ?? undefined,
    evidence: buildEvidence(picked, contrastSession),
  };
}

function findContrast(
  ordeal: CanonSession,
  sessions: CanonSession[]
): CanonSession | null {
  if (sessions.length < 2) return null;

  // Look for the session with the biggest score difference
  let bestContrast: CanonSession | null = null;
  let maxDiff = 0;

  for (const s of sessions) {
    if (s.id === ordeal.id) continue;
    if (ordeal.devotionScore === null || s.devotionScore === null) continue;

    const diff = Math.abs(ordeal.devotionScore - s.devotionScore);
    if (diff > maxDiff) {
      maxDiff = diff;
      bestContrast = s;
    }
  }

  // Only return if the contrast is meaningful (>= 8 point difference)
  return maxDiff >= 8 ? bestContrast : null;
}

function buildReason(session: CanonSession, canon: Canon): string {
  const reasons: string[] = [];

  if (session.vibeLine) reasons.push('has a vibe line');
  if (session.isComeback) reasons.push(`comeback after ${session.restDaysBefore} days`);
  if (session.devotionScore === canon.bestScore) reasons.push('highest score of the month');
  if (session.devotionScore === canon.worstScore) reasons.push('lowest score of the month');
  if (session.effort && ['ALL_OUT_9', 'ALL_OUT_10'].includes(session.effort)) {
    reasons.push('all-out effort');
  }

  return reasons.length > 0 ? reasons.join(', ') : 'most emotionally distinct session';
}

function buildEvidence(ordeal: CanonSession, contrast: CanonSession | null): string[] {
  const evidence: string[] = [];

  evidence.push(`Session ${ordeal.date}: ${ordeal.workoutTitle ?? 'Custom'}, score ${ordeal.devotionScore ?? 'N/A'}, effort ${ordeal.effort ?? 'N/A'}`);
  if (ordeal.vibeLine) evidence.push(`Vibe: "${ordeal.vibeLine}"`);
  if (ordeal.note) evidence.push(`Note: "${ordeal.note}"`);

  if (contrast) {
    evidence.push(`Contrast: ${contrast.date}, score ${contrast.devotionScore ?? 'N/A'}, effort ${contrast.effort ?? 'N/A'}`);
    if (contrast.vibeLine) evidence.push(`Contrast vibe: "${contrast.vibeLine}"`);
  }

  return evidence;
}
