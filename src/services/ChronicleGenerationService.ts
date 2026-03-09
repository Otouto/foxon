import Anthropic from '@anthropic-ai/sdk';
import type { ChronicleChapterContent } from '@/lib/types/chronicle';
import type { NarrativePlan } from './chronicle/types';

const SYSTEM_PROMPT = `You are the narrator of a personal training chronicle for a single user.
You write monthly chapters that are honest, grounded, and brief.
You receive a pre-computed NarrativePlan — your job is to WRITE, not to analyze.
The plan tells you WHAT each section is about. You decide HOW to say it.

---

## The World

The user trains on a path toward physical transformation. Two symbols
structure this world:

**The Fox** — who the user is right now, measured by consistency.
The fox has four states: SLIM → FIT → STRONG → FIERY.
This is earned monthly through showing up, not through performance alone.

**The Bison** — who the user is becoming, measured by the program they
follow and the physical capacity they are building. The bison path is named
in workout titles (e.g. "Шлях Бізона", "Бізонячі ручки").
Reference it only when the workout names themselves invoke it.

---

## Voice Rules

- Write in second person ("you"), present tense where possible
- Quote vibe lines verbatim, in their original language, with no translation
- Never invent atmosphere, metaphor, or emotion not traceable to the evidence provided
- Never use: "journey", "frontier", "chapter of your life", "next level",
  "dedication", "you should be proud"
- Do not soften negative data with philosophy — name the gap, then
  contextualize if warranted
- Write like you respect the reader's intelligence and have no agenda
  except accuracy
- Vibe lines must always be formatted as blockquotes: > [vibe line text]
- Workout names within prose must be italicised: *Шлях Бізона*
- Do not bold random words for emphasis — bold is reserved for
  metric values inside the numbers table only

---

## Continuity Rules

- If a carryForward section is provided, you MUST address it. State whether
  the previous chapter's prediction held, failed, or landed somewhere in between.
  Use the bridge verdict and check results as your guide.
- Do NOT repeat the exact same evidence across sections. Each section has
  its own assigned evidence — use only what's given for that section.

---

## Interpretation Rules

- Every claim in earnedTruth must trace to the evidence provided.
  Do not generalize beyond what the numbers show.
- The nextTest must be a concrete, testable prediction — not a hope.

---

## Structure

The output has 8 fields. Fields "carryForward" and "threshold" are conditional —
populate them only when the plan includes them.

---

### Field: title
**Max 6 words, no clichés.**
Must not reuse words from recent titles (provided in style constraints).

---

### Field: verdict
**One sentence. No header displayed.**
The plan provides: dominant theme, counterweight, and grounding fact.
Weave all three into one sentence with a conjunction ("but", "and", "yet").

---

### Field: carryForward *(conditional — null if not in plan)*
**1-2 sentences.**
Address the previous chapter's prediction. Use the bridge verdict
(confirmed/disproved/complicated/inconclusive) as your frame.
Keep it brief — this is a callback, not a new section.

---

### Field: threshold *(conditional — null if not in plan)*
**1 short paragraph.**
The plan tells you the type and detail. Name the specific event concretely.
One sentence on what it means. Stop.

When the type is "fox_state_change", include this line on its own after the paragraph:
**🦊 [PREV STATE] → [NEW STATE]**

---

### Field: ordeal
**3-5 sentences.**
The plan gives you ONE session and a reason. Write about that session only.

Structure:
1. Day + date + workout name, plain
2. Vibe line quoted verbatim as blockquote
3. One observation about what it reveals — specific, not universal
4. Optional: one-line contrast with the contrast session if provided

---

### Field: earnedTruth
**2-3 sentences.**
State the pattern claim as an evidence-based finding, not a compliment.
Reference the specific numbers that support it. End with the confidence
qualifier (strong/moderate/emerging based on confidence score).

---

### Field: numbers
**Markdown table. No prose.**
Use the pre-computed values from the plan. Must show exactly three rows:
Sessions, Avg Devotion, Fox State.

---

### Field: nextTest
**2-3 sentences.**
Frame the structured test as a live question for next month.
Reference the hypothesis and the specific checks that would confirm or
disprove it. Must include at least one concrete number.

---

## Output Format

Return valid JSON only. No markdown code fences. No preamble.

{
  "title": "string — max 6 words",
  "verdict": "string — one sentence with conjunction",
  "carryForward": "string | null",
  "threshold": "string | null",
  "ordeal": "string — 3-5 sentences",
  "earnedTruth": "string — 2-3 sentences",
  "numbers": "string — markdown table only",
  "nextTest": "string — 2-3 sentences"
}

Numbers field must be a markdown table in exactly this format:
| | This Month | Prev Month | Δ |
|---|---|---|---|
| Sessions | **X** of Y | Z | +/− |
| Avg Devotion | **X** | Z | +/− |
| Fox State | **STATE** | STATE | ↑/↓/— |

`;

export class ChronicleGenerationService {
  /**
   * Generate a chronicle chapter using Claude API from a NarrativePlan
   */
  static async generateChronicle(plan: NarrativePlan): Promise<ChronicleChapterContent> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    const client = new Anthropic({ apiKey });
    const userPrompt = this.buildUserPrompt(plan);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    // Parse JSON response
    let parsed: ChronicleChapterContent;
    try {
      parsed = JSON.parse(contentBlock.text);
    } catch {
      const match = contentBlock.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Claude returned non-JSON response for chronicle');
      parsed = JSON.parse(match[0]);
    }

    return parsed;
  }

  /**
   * Build the user prompt — serializes NarrativePlan (not raw data)
   */
  private static buildUserPrompt(plan: NarrativePlan): string {
    const parts: string[] = [];

    parts.push(`Generate Chapter ${plan.chapter.number} of the Fox Chronicle.`);
    parts.push(`Month: ${plan.chapter.monthName}`);
    parts.push(`User: ${plan.chapter.userName}`);
    parts.push('');

    // Pre-computed numbers for the table
    parts.push('## Numbers (use these exact values in the table)');
    parts.push(`Sessions this month: ${plan.numbers.sessionCount}`);
    parts.push(`Monthly target: ${plan.numbers.monthlyTarget}`);
    parts.push(`Hit rate: ${plan.numbers.hitRate}%`);
    parts.push(`Avg devotion: ${plan.numbers.avgDevotion ?? 'N/A'}`);
    parts.push(`Prev avg devotion: ${plan.numbers.prevAvgDevotion ?? 'N/A'}`);
    parts.push(`Prev sessions: ${plan.numbers.prevSessionCount ?? 'N/A'}`);
    parts.push(`Fox state: ${plan.numbers.foxStateStart} → ${plan.numbers.foxStateEnd}`);
    parts.push(`Prev fox state: ${plan.numbers.prevFoxState ?? 'N/A'}`);
    parts.push('');

    // Verdict directive
    parts.push('## Verdict Directive');
    parts.push(`Dominant theme: ${plan.sections.verdict.dominantTheme}`);
    parts.push(`Counterweight: ${plan.sections.verdict.counterweight}`);
    parts.push(`Grounding fact: ${plan.sections.verdict.groundingFact}`);
    if (plan.sections.verdict.evidence.length > 0) {
      parts.push(`Evidence: ${plan.sections.verdict.evidence.join(' | ')}`);
    }
    parts.push('');

    // CarryForward directive
    if (plan.sections.carryForward) {
      parts.push('## CarryForward Directive');
      parts.push(`Bridge verdict: ${plan.sections.carryForward.bridge.verdict}`);
      parts.push(`Summary: ${plan.sections.carryForward.bridge.summary}`);
      for (const r of plan.sections.carryForward.bridge.checkResults) {
        parts.push(`  Check: ${r.check.label} → ${r.passed ? 'PASSED' : 'FAILED'} (actual: ${r.actual ?? 'N/A'})`);
      }
      parts.push('');
    }

    // Threshold directive
    if (plan.sections.threshold) {
      parts.push('## Threshold Directive');
      parts.push(`Type: ${plan.sections.threshold.type}`);
      parts.push(`Detail: ${plan.sections.threshold.detail}`);
      if (plan.sections.threshold.evidence.length > 0) {
        parts.push(`Evidence: ${plan.sections.threshold.evidence.join(' | ')}`);
      }
      parts.push('');
    }

    // Ordeal directive
    parts.push('## Ordeal Directive');
    const s = plan.sections.ordeal.session;
    const dateStr = new Date(s.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    parts.push(`Session: ${dateStr} — ${s.workoutTitle || 'Custom workout'}`);
    parts.push(`Score: ${s.devotionScore ?? 'N/A'} (${s.devotionGrade ?? 'N/A'}) | Effort: ${s.effort ?? 'N/A'}`);
    parts.push(`Reason selected: ${plan.sections.ordeal.reason}`);
    if (s.vibeLine) parts.push(`Vibe line: "${s.vibeLine}"`);
    if (s.note) parts.push(`Note: "${s.note}"`);
    if (plan.sections.ordeal.contrastSession) {
      const c = plan.sections.ordeal.contrastSession;
      const cDate = new Date(c.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      parts.push(`Contrast session: ${cDate} — score ${c.devotionScore ?? 'N/A'}, effort ${c.effort ?? 'N/A'}`);
      if (c.vibeLine) parts.push(`Contrast vibe: "${c.vibeLine}"`);
    }
    if (plan.sections.ordeal.evidence.length > 0) {
      parts.push(`Evidence: ${plan.sections.ordeal.evidence.join(' | ')}`);
    }
    parts.push('');

    // EarnedTruth directive
    parts.push('## EarnedTruth Directive');
    parts.push(`Claim: ${plan.sections.earnedTruth.claim.claim}`);
    parts.push(`Confidence: ${plan.sections.earnedTruth.claim.confidence}/100`);
    if (plan.sections.earnedTruth.evidence.length > 0) {
      parts.push(`Evidence: ${plan.sections.earnedTruth.evidence.join(' | ')}`);
    }
    parts.push('');

    // NextTest directive
    parts.push('## NextTest Directive');
    parts.push(`Subject: ${plan.sections.nextTest.meta.subject}`);
    parts.push(`Kind: ${plan.sections.nextTest.meta.kind}`);
    parts.push(`Hypothesis: ${plan.sections.nextTest.meta.hypothesis}`);
    parts.push('Checks:');
    for (const check of plan.sections.nextTest.meta.checks) {
      parts.push(`  - ${check.label} (${check.metric} ${check.operator} ${check.value})`);
    }
    parts.push('');

    // Style constraints
    parts.push('## Style Constraints');
    if (plan.style.recentTitles.length > 0) {
      parts.push(`Recent titles (avoid reusing words): ${plan.style.recentTitles.join(', ')}`);
    }
    if (plan.style.bannedPhrases.length > 0) {
      parts.push(`Banned phrases: ${plan.style.bannedPhrases.join(', ')}`);
    }

    return parts.join('\n');
  }
}
