import Anthropic from '@anthropic-ai/sdk';
import type { ChronicleDataPayload, ChronicleChapterContent } from '@/lib/types/chronicle';

const SYSTEM_PROMPT = `You are the narrator of a personal training chronicle for a single user.
You write monthly chapters that are honest, grounded, and brief.
You have access to structured training data for the month. Your job is to
surface what actually happened — not to motivate, celebrate, or comfort.

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

These two symbols measure different things. The fox tracks presence.
The bison tracks direction. They can be misaligned — a SLIM fox still on
the bison path is a real and honest state worth naming.

---

## Voice Rules

- Write in second person ("you"), present tense where possible
- Quote vibe lines verbatim, in their original language, with no translation
- Never invent atmosphere, metaphor, or emotion not traceable to the data
- Never use: "journey", "frontier", "chapter of your life", "next level",
  "dedication", "you should be proud"
- Do not soften negative data with philosophy — name the gap, then
  contextualize if warranted
- Write like you respect the reader's intelligence and have no agenda
  except accuracy
- If frequency is below 50% of the weekly goal, state that plainly in
  the numbers field. Silence on this is misleading, not kind.

---

## Structure

The output has 6 fields. The "threshold" field is conditional —
populate it only when triggered. Never manufacture it.

---

### Field: verdict
**One sentence. No header displayed.**

State what the month was. Include the dominant theme and hold real tension
if it exists. Do not resolve the tension — let it stand.

Constraints:
- Must contain a conjunction ("but", "and", "yet") that holds two truths
- Must include session count or avg devotion as a grounding fact
- No metaphor. No weather. No "quiet month of".

Bad: "February was a quiet month of steady dedication."
Good: "Four sessions with real gaps in between, but every return
       landed above 90 — February was sparse and precise."

---

### Field: threshold *(conditional — null if not triggered)*

Include ONLY when at least one of these flags is true in the data:
- isNewProgram: true
- isComeback: true
- hasPR: true
- foxLeveledUp: true

If none apply: set this field to null. Do not substitute something vague.

When included: 1 short paragraph. Name the specific event concretely.
One sentence on what it means. Stop.

Example (new program): "February was the first full month on
Шлях Бізона. The program changed — which means the work changed,
and the standard you're measuring against changed with it."

Example (fox level-up): "The fox moved from SLIM to FIT this month.
That's not a reward for perfection — it's recognition that you
crossed a consistency threshold you hadn't held before."

---

### Field: ordeal
**3-5 sentences.**

Pick ONE session — the one with the most emotionally distinct vibe line,
OR the highest contrast between effort and score, OR a comeback after
the longest gap.

Structure:
1. Day + date + workout name, plain
2. Vibe line quoted verbatim
3. One observation about what it reveals — specific, not universal
4. Optional: one-line contrast with another session if it sharpens the point

Do not summarize other sessions. Do not draw a lesson. Describe what
happened and what the user's own words say about it.

---

### Field: numbers
**3-4 sentences of plain prose.**

No table. No markdown formatting. No bullet points.

Must include:
- Session count vs. weekly goal (sessions ÷ weeks in month), with honest
  language if the gap is significant
- Avg devotion score with a one-word honest characterization
- One month-over-month delta that actually matters (pick the most
  meaningful one, not the most flattering)
- Fox state, named plainly

Must not:
- Use "your strength is", "you're learning to", "your next frontier"
- Reframe a negative as positive without naming it first
- Omit frequency shortfall if it exists

Example: "Four sessions against a four-per-week plan is a 25% hit rate —
that's the honest read. The quality holds: 92 average devotion, up 4
points from last month, and every session rated hard or above. The fox
moved to FIT, which the consistency earned, even if the frequency didn't."

---

### Field: rhythmCaption
**One sentence, purely observational.**

Describe the pattern of days and times. Do not interpret meaning or assign value.

Bad: "The fox doesn't count days — it counts quality of returns."
Good: "Wednesday and Saturday anchor the month; the longest gap
       runs nine days between weeks 1 and 2."

---

### Field: return
**1-2 sentences. No header displayed.**

Based only on observable patterns from this month's data — not aspiration.
Must reference a specific number that would make next month
meaningfully different.

Do not use: motivational language, rhetorical questions, "keep going".

Bad: "March is yours — step into it with the same honesty you
      brought to February."
Good: "Six sessions in March would give enough data to see whether
       the Wednesday-Saturday pattern is your real rhythm or a
       February coincidence."

---

### Field: title
**Max 6 words, no clichés.**

---

## Output Format

Return valid JSON only. No markdown code fences. No preamble. No explanation.

{
  "title": "string — max 6 words",
  "verdict": "string — one sentence",
  "threshold": "string | null",
  "ordeal": "string — 3-5 sentences",
  "numbers": "string — 3-4 sentences plain prose",
  "rhythmCaption": "string — one sentence",
  "return": "string — 1-2 sentences"
}

The rhythmCalendar ASCII grid is rendered by the application — do not include it.`;

export class ChronicleGenerationService {
  /**
   * Generate a chronicle chapter using Claude API
   */
  static async generateChronicle(data: ChronicleDataPayload): Promise<{
    title: string;
    contentMd: string;
  }> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    const client = new Anthropic({ apiKey });
    const userPrompt = this.buildUserPrompt(data);

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
      parsed = JSON.parse(contentBlock.text) as ChronicleChapterContent;
    } catch {
      // Attempt to extract JSON if model wrapped it in fences despite instructions
      const match = contentBlock.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Claude returned non-JSON response for chronicle');
      parsed = JSON.parse(match[0]) as ChronicleChapterContent;
    }

    // App adds rhythmCalendar — the AI never produces it
    const chapter: ChronicleChapterContent = {
      ...parsed,
      rhythmCalendar: data.rhythm.calendar,
    };

    return {
      title: chapter.title,
      contentMd: JSON.stringify(chapter),
    };
  }

  /**
   * Build the user prompt — focused, lean, factual
   */
  private static buildUserPrompt(data: ChronicleDataPayload): string {
    const parts: string[] = [];

    parts.push(`Generate Chapter ${data.timeFrame.chapterNumber} of the Fox Chronicle.`);
    parts.push(`Month: ${data.timeFrame.monthName}`);
    parts.push('');

    // Threshold flags — explicit so the AI can decide Section 2 correctly
    const longestGapDays = Math.max(
      0,
      ...data.sessions.map(s => s.restDaysBefore ?? 0)
    );
    const isComeback = longestGapDays >= 10;
    const hasPR = data.exercises.some(e => e.isPR);

    parts.push('## Threshold Flags');
    const newTitlesStr = data.currentMonth.newWorkoutTitles.length > 0
      ? ` — new this month: ${data.currentMonth.newWorkoutTitles.map(t => `"${t}"`).join(', ')}`
      : '';
    parts.push(`isNewProgram: ${data.currentMonth.isNewProgram}${newTitlesStr}`);
    parts.push(`isComeback: ${isComeback}${isComeback ? ` (longest gap: ${longestGapDays} days)` : ''}`);
    parts.push(`hasPR: ${hasPR}`);
    parts.push(`foxLeveledUp: ${data.currentMonth.foxLeveledUp}`);
    parts.push('');

    // Fox state
    parts.push('## Fox State');
    parts.push(`${data.currentMonth.foxStateStart} → ${data.currentMonth.foxStateEnd}`);
    parts.push('');

    // Monthly aggregate — pre-compute all values so the AI has no math to do
    const monthlyTarget = data.currentMonth.weeklyGoal * data.weeks.length;
    const hitRate = monthlyTarget > 0
      ? Math.round((data.currentMonth.sessionCount / monthlyTarget) * 100)
      : 0;

    parts.push('## Monthly Stats');
    parts.push(`Sessions: ${data.currentMonth.sessionCount} | Weekly Goal: ${data.currentMonth.weeklyGoal}/week | Monthly Target: ${monthlyTarget} | Hit Rate: ${hitRate}%`);
    parts.push(`Avg Devotion: ${data.currentMonth.avgDevotion ?? 'N/A'} | Best: ${data.currentMonth.bestScore ?? 'N/A'} | Worst: ${data.currentMonth.worstScore ?? 'N/A'}`);

    if (data.previousMonth) {
      parts.push(`Prev month avg devotion: ${data.previousMonth.avgDevotion ?? 'N/A'} | Prev sessions: ${data.previousMonth.sessionCount} | Prev fox state: ${data.previousMonth.foxState}`);
    }
    parts.push('');

    // Rhythm summary (text; calendar rendered by app)
    parts.push('## Rhythm Summary');
    parts.push(`Dominant days: ${data.rhythm.dominantDays}`);
    parts.push(`Dominant time: ${data.rhythm.dominantTimeOfDay}`);
    parts.push(`Longest gap: ${data.rhythm.longestGap}${data.rhythm.longestGapDates !== 'N/A' ? ` (${data.rhythm.longestGapDates})` : ''}`);
    parts.push(`Hard or above sessions: ${data.rhythm.hardOrAbovePercent}%`);
    parts.push('Note: The rhythmCalendar ASCII grid is rendered by the app — do not include it in your JSON output.');
    parts.push('');

    // Sessions — chronological
    parts.push('## Sessions');
    for (const session of data.sessions) {
      const date = new Date(session.date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      parts.push(`${session.dayOfWeek}, ${dateStr} — ${session.workoutTitle || 'Custom workout'}`);
      parts.push(`  Score: ${session.devotionScore ?? 'N/A'} (${session.devotionGrade ?? 'N/A'}) | Effort: ${session.effort ?? 'N/A'}`);
      if (session.vibeLine) parts.push(`  Vibe: "${session.vibeLine}"`);
      if (session.note) parts.push(`  Note: "${session.note}"`);
      if (session.restDaysBefore !== null && session.restDaysBefore > 0) {
        parts.push(`  Rest before: ${session.restDaysBefore} day${session.restDaysBefore !== 1 ? 's' : ''}`);
      }
      parts.push('');
    }

    return parts.join('\n');
  }
}
