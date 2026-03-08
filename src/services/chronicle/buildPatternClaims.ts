import type { Canon, ContinuityBridge, PatternClaim } from './types';

/**
 * buildPatternClaims — generates ranked pattern claims from canon data.
 * 5-7 hardcoded rules, each producing a claim if conditions are met.
 */
export function buildPatternClaims(
  canon: Canon,
  bridge: ContinuityBridge | null
): PatternClaim[] {
  const claims: PatternClaim[] = [];

  // 1. Rhythm consistency — 3+ weeks hit goal
  const weeksHit = canon.weeks.filter(w => w.hitGoal).length;
  if (weeksHit >= 3) {
    claims.push({
      id: 'rhythm_consistency',
      claim: `Hit weekly goal ${weeksHit} of ${canon.weeks.length} weeks — rhythm is established`,
      evidence: [
        `Weekly goal: ${canon.weeklyGoal}`,
        `Weeks at goal: ${weeksHit}/${canon.weeks.length}`,
        `Hit rate: ${canon.hitRate}%`,
      ],
      confidence: Math.min(90, 50 + weeksHit * 10),
    });
  }

  // 2. Score stability — variance < 5
  if (canon.scoreVariance !== null && canon.scoreVariance < 5 && canon.sessionCount >= 4) {
    claims.push({
      id: 'score_stability',
      claim: `Devotion scores are remarkably stable (variance ${canon.scoreVariance})`,
      evidence: [
        `Score variance: ${canon.scoreVariance}`,
        `Range: ${canon.worstScore} → ${canon.bestScore}`,
        `Session count: ${canon.sessionCount}`,
      ],
      confidence: 75,
    });
  }

  // 3. Pillar identity — one pillar 10+ above others
  const pillarAvgs: Record<string, number> = {
    EC: canon.pillars.avgEC,
    SC: canon.pillars.avgSC,
    RF: canon.pillars.avgRF,
  };
  if (canon.pillars.avgLF !== null) pillarAvgs.LF = canon.pillars.avgLF;

  const pillarValues = Object.values(pillarAvgs);
  const meanPillar = pillarValues.reduce((a, b) => a + b, 0) / pillarValues.length;
  for (const [name, val] of Object.entries(pillarAvgs)) {
    if (val >= meanPillar + 10) {
      claims.push({
        id: 'pillar_identity',
        claim: `${name} is your strongest pillar, consistently ${Math.round(val - meanPillar)} points above average`,
        evidence: [
          `${name}: ${Math.round(val)}`,
          `Mean across pillars: ${Math.round(meanPillar)}`,
          `Strongest: ${canon.pillars.strongest}, Weakest: ${canon.pillars.weakest}`,
        ],
        confidence: 70,
      });
      break; // Only report one pillar identity
    }
  }

  // 4. Gap recovery — comeback sessions score within 5 of avg
  if (canon.isComeback && canon.avgDevotion !== null) {
    const comebackSessions = canon.sessions.filter(s => s.isComeback && s.devotionScore !== null);
    if (comebackSessions.length > 0) {
      const comebackAvg = comebackSessions.reduce((sum, s) => sum + s.devotionScore!, 0) / comebackSessions.length;
      const delta = Math.abs(comebackAvg - canon.avgDevotion);
      if (delta <= 5) {
        claims.push({
          id: 'gap_recovery',
          claim: `Comeback sessions scored within ${Math.round(delta)} of monthly average — recovery is solid`,
          evidence: [
            `Comeback avg: ${Math.round(comebackAvg)}`,
            `Monthly avg: ${canon.avgDevotion}`,
            `Gap: ${canon.longestGapDays} days`,
          ],
          confidence: 65,
        });
      }
    }
  }

  // 5. Program adaptation — new program sessions trend up
  if (canon.isNewProgram && canon.sessions.length >= 3) {
    const scored = canon.sessions
      .filter(s => s.devotionScore !== null)
      .map(s => s.devotionScore!);
    if (scored.length >= 3) {
      const firstHalf = scored.slice(0, Math.floor(scored.length / 2));
      const secondHalf = scored.slice(Math.floor(scored.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      if (secondAvg > firstAvg + 2) {
        claims.push({
          id: 'program_adaptation',
          claim: `Scores trending up on new program — adaptation is working`,
          evidence: [
            `First half avg: ${Math.round(firstAvg)}`,
            `Second half avg: ${Math.round(secondAvg)}`,
            `New workouts: ${canon.newWorkoutTitles.join(', ')}`,
          ],
          confidence: 60,
        });
      }
    }
  }

  // 6. Time-of-day pattern — dominant time scores 5+ higher
  if (canon.sessions.length >= 4) {
    const byTime = new Map<string, number[]>();
    for (const s of canon.sessions) {
      if (s.devotionScore === null) continue;
      const arr = byTime.get(s.timeOfDay) ?? [];
      arr.push(s.devotionScore);
      byTime.set(s.timeOfDay, arr);
    }
    let bestTime = '';
    let bestAvg = 0;
    let overallAvg = 0;
    let totalCount = 0;
    for (const [time, scores] of byTime) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      totalCount += scores.length;
      overallAvg += scores.reduce((a, b) => a + b, 0);
      if (avg > bestAvg && scores.length >= 2) {
        bestAvg = avg;
        bestTime = time;
      }
    }
    overallAvg = totalCount > 0 ? overallAvg / totalCount : 0;
    if (bestTime && bestAvg > overallAvg + 5) {
      claims.push({
        id: 'time_of_day_pattern',
        claim: `${bestTime} sessions score ${Math.round(bestAvg - overallAvg)} points higher on average`,
        evidence: [
          `${bestTime} avg: ${Math.round(bestAvg)}`,
          `Overall avg: ${Math.round(overallAvg)}`,
          `Dominant time: ${canon.dominantTimeOfDay}`,
        ],
        confidence: 55,
      });
    }
  }

  // 7. Effort-score correlation
  if (canon.sessions.length >= 4) {
    const highEffort = canon.sessions.filter(s =>
      s.effort && ['HARD_7', 'HARD_8', 'ALL_OUT_9', 'ALL_OUT_10'].includes(s.effort) &&
      s.devotionScore !== null
    );
    const lowEffort = canon.sessions.filter(s =>
      s.effort && ['EASY_1', 'EASY_2', 'EASY_3', 'MODERATE_4', 'MODERATE_5', 'MODERATE_6'].includes(s.effort) &&
      s.devotionScore !== null
    );
    if (highEffort.length >= 2 && lowEffort.length >= 2) {
      const highAvg = highEffort.reduce((sum, s) => sum + s.devotionScore!, 0) / highEffort.length;
      const lowAvg = lowEffort.reduce((sum, s) => sum + s.devotionScore!, 0) / lowEffort.length;
      if (Math.abs(highAvg - lowAvg) >= 5) {
        const direction = highAvg > lowAvg ? 'higher' : 'lower';
        claims.push({
          id: 'effort_score_correlation',
          claim: `High-effort sessions score ${Math.round(Math.abs(highAvg - lowAvg))} points ${direction} than moderate/easy ones`,
          evidence: [
            `High effort avg: ${Math.round(highAvg)} (${highEffort.length} sessions)`,
            `Moderate/easy avg: ${Math.round(lowAvg)} (${lowEffort.length} sessions)`,
          ],
          confidence: 50,
        });
      }
    }
  }

  // Mark confirmed claims from continuity bridge
  if (bridge?.verdict === 'confirmed' && bridge.previousNextTest) {
    const confirmed = claims.find(c => c.id === bridge.previousNextTest.subject);
    if (confirmed) confirmed.isConfirmed = true;
  }

  // Sort by confidence descending
  claims.sort((a, b) => b.confidence - a.confidence);

  return claims;
}
