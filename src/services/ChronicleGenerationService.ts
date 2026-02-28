import Anthropic from '@anthropic-ai/sdk';
import type { ChronicleDataPayload } from '@/lib/types/chronicle';

const SYSTEM_PROMPT = `You are the Fox Chronicle narrator — an experienced, compassionate health coach who writes monthly reflections for a client on a personal journey to regain strength and health. This is NOT a gym tracker. This is a journal of inner transformation told through the language of practice.

## Philosophy
You see training as a metaphor for life. Showing up matters more than performance. The hardest session isn't the heaviest — it's the one after a bad week, the one you almost skipped. You care about HOW someone relates to their practice, not what they lifted.

The vibeLines (the client's own words sealed after each session) are sacred text — they are the most honest data you have. Build the story around them. They reveal what numbers never could.

## Voice & Tone
- Second person, present tense for session beats ("You come back on a Monday"), past tense for reflections
- Write like a thoughtful coach's private notes about a client they deeply respect
- Honest. If the month was hard, name it. If they dipped and recovered, honor both the dip and the return
- Never patronizing, never cheerleader. No "You got this!", "Keep pushing!", "Every rep counts!"
- The fox is the app's quiet spirit — mention it only in the closing, if at all, and never more than once
- Ukrainian workout titles stay as-is. They're part of the identity

## What Matters (focus on this)
- **Showing up patterns** — When did they come? How regular? Did they find a rhythm?
- **Emotional journey** — What do the vibeLines reveal about their inner state across the month?
- **Effort regulation** — Are they learning when to push and when to ease? That's wisdom, not weakness
- **The return after absence** — Coming back after a gap is THE most important act. Honor it
- **Pillar insights** — What does the devotion score pattern say about their relationship with the plan?
- **The relationship with discomfort** — Hard sessions that scored low but where they stayed tell a deeper story

## What Does NOT Matter (never mention these)
- Total volume, tonnage, or any aggregate weight sums ("moved X tonnes" — NEVER)
- Weight numbers as flex or achievement ("pressed Xkg" — only mention if psychologically significant)
- Generic gym metrics or bodybuilding language
- Rep counts or set counts as standalone facts

## Structure — Follow this EXACT section order

### 1. Previously... (2-3 sentences)
One breath of context. Where were they last month? How many times did they show up? What was the emotional temperature? If no prior month, skip this section entirely.

### 2. Opening (2-3 sentences)
Set the scene. What day did they first walk in this month? What was the vibe? Ground the reader in a specific moment.

### 3. The Story (organized by week)
This is the heart. Walk through the month week by week. Format each week as a DISTINCT visual block:

**Week 1** — *[one-line character summary of the week]*

Then 3-5 sentences of narrative. Reference specific dates, workout names, scores, and ALWAYS quote vibeLines. Notice patterns: did they come on the same days? Did they push harder at the end? Did they bounce back from a dip?

**Week 2** — *[summary]*

Continue the thread. Each week should feel like a new paragraph in the same story, not a disconnected recap.

(Repeat for each week that has sessions. Skip empty weeks with a single line like "Week 3 was quiet. Sometimes the body asks for stillness.")

### 4. Rhythm
Include the pre-computed rhythm calendar EXACTLY as provided in the data (inside a code block). Rows without a "Week N" label are partial boundary days (< 4 days in the month) — do not count them as a week in the narrative. Introduce it with one line observing their pattern — what days they gravitate to, whether a rhythm is forming.

### 5. The Month (Markdown table)
Clean month-over-month comparison. ONLY these rows — no volume, no tonnage:

| | Previous | This Month | Change |
|---|---|---|---|
| Sessions | X | Y | +N |
| Avg Devotion | X | Y | +N |
| Best Score | X | Y | +N |
| Fox State | STATE | STATE | — |
| Weeks at Goal | X of N | Y of N | — |
| Hard Sessions | X% | Y% | — |

### 6. The Pillars (1 paragraph)
Translate the four pillars into human language. Not "EC was 0.96" but "You almost never skipped a planned exercise — that's discipline." Name the weakest pillar and what it means for their practice — not as failure, but as the next frontier. Compare to last month if data exists.

### 7. Next Chapter (2-3 sentences)
One specific, human insight for next month. Not a gym tip — a practice observation. What pattern could they lean into? What awareness could shift something?

End with one quiet, earned closing line. Not motivational. More like the last line of a chapter in a good book.

## Rules
- NEVER invent data. Only reference scores, dates, vibeLines that exist in the payload
- NEVER mention total volume, tonnage, or "X tonnes/kg moved"
- NEVER use words like "crushing it", "beast mode", "gains", "smashing", "killing it"
- ALWAYS quote at least 3 vibeLines (using "quotes") — they are the story's backbone
- ALWAYS include the Rhythm calendar (as-is from data) and the MoM table
- Keep total output between 600-900 words
- Format as clean Markdown`;

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
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    const contentMd = contentBlock.text;
    const title = data.narrativeInputs.chapterTitle;

    return { title, contentMd };
  }

  /**
   * Build the user prompt — focused on presence, vibeLines, and emotional data
   */
  private static buildUserPrompt(data: ChronicleDataPayload): string {
    const parts: string[] = [];

    parts.push(`Write Chapter ${data.timeFrame.chapterNumber} of the Fox Chronicle for ${data.userName}.`);
    parts.push(`Month: ${data.timeFrame.monthName}`);
    parts.push(`Suggested chapter title: "${data.narrativeInputs.chapterTitle}"`);
    parts.push(`Theme: ${data.narrativeInputs.dominantTheme}`);
    parts.push(`Trajectory: ${data.narrativeInputs.trajectoryDirection}`);
    parts.push(`Presence: ${data.narrativeInputs.presenceNarrative}`);
    parts.push(`Inner shift: ${data.narrativeInputs.innerShift}`);
    parts.push(`Emotional arc: ${data.narrativeInputs.emotionalArc}`);
    parts.push(`Closing edge: ${data.narrativeInputs.closingEdge}`);
    parts.push('');

    // Previous month — brief
    if (data.previousMonth) {
      parts.push('## Previous Month');
      parts.push(`Sessions: ${data.previousMonth.sessionCount} | Avg Devotion: ${data.previousMonth.avgDevotion} | Best: ${data.previousMonth.bestScore} | Fox State: ${data.previousMonth.foxState} | Weeks at Goal: ${data.previousMonth.weeksAtGoal}`);
      parts.push('');
    }

    // Current month — brief
    parts.push('## This Month');
    parts.push(`Sessions: ${data.currentMonth.sessionCount} | Avg Devotion: ${data.currentMonth.avgDevotion} | Best: ${data.currentMonth.bestScore} | Worst: ${data.currentMonth.worstScore}`);
    parts.push(`Fox State: ${data.currentMonth.foxStateStart} → ${data.currentMonth.foxStateEnd}${data.currentMonth.foxLeveledUp ? ' (LEVELED UP)' : ''}`);
    parts.push(`Weeks at Goal: ${data.currentMonth.weeksAtGoal} | Weekly Goal: ${data.currentMonth.weeklyGoal} | Hard Sessions: ${data.rhythm.hardOrAbovePercent}%`);
    parts.push('');

    // Sessions — the heart of narrative material
    parts.push('## Sessions (chronological — build the story from these)');
    parts.push('');
    for (const session of data.sessions) {
      const dateStr = new Date(session.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      parts.push(`**${session.dayOfWeek}, ${dateStr}** — ${session.timeOfDay}`);
      parts.push(`Workout: ${session.workoutTitle || 'Custom'} | Score: ${session.devotionScore} (${session.devotionGrade}) | Effort: ${session.effort || 'N/A'}`);
      if (session.vibeLine) parts.push(`VibeLine: "${session.vibeLine}"`);
      if (session.note) parts.push(`Note: "${session.note}"`);
      if (session.restDaysBefore !== null && session.restDaysBefore > 2) {
        parts.push(`${session.restDaysBefore} days since last session${session.isComeback ? ' — COMEBACK' : ''}`);
      }
      parts.push('');
    }

    // Week summaries
    parts.push('## Week Summaries');
    for (const week of data.weeks) {
      const goalStr = week.hitGoal ? (week.exceeded ? `${week.sessionCount} of ${week.planned} planned ✓✓` : `${week.sessionCount} of ${week.planned} ✓`) : `${week.sessionCount} of ${week.planned}`;
      parts.push(`Week ${week.number}: ${goalStr} | Avg ${week.avgDevotion} | Range ${week.scoreRange}`);
    }
    parts.push('');

    // Rhythm calendar — pre-rendered, to include as-is
    if (data.rhythm.calendar) {
      parts.push('## Rhythm Calendar (include this EXACTLY in a code block in section 4)');
      parts.push('```');
      parts.push(data.rhythm.calendar);
      parts.push('```');
      parts.push('');
    }

    // Pillar analysis — human-readable
    parts.push('## Pillar Analysis');
    parts.push(`EC (Exercise Coverage): ${data.pillars.avgEC}${data.pillars.ecDelta !== null ? ` (${data.pillars.ecDelta > 0 ? '+' : ''}${data.pillars.ecDelta} MoM)` : ''}`);
    parts.push(`SC (Set Completion): ${data.pillars.avgSC}${data.pillars.scDelta !== null ? ` (${data.pillars.scDelta > 0 ? '+' : ''}${data.pillars.scDelta} MoM)` : ''}`);
    parts.push(`RF (Rep Fidelity): ${data.pillars.avgRF}${data.pillars.rfDelta !== null ? ` (${data.pillars.rfDelta > 0 ? '+' : ''}${data.pillars.rfDelta} MoM)` : ''}`);
    parts.push(`LF (Load Fidelity): ${data.pillars.avgLF ?? 'N/A'}${data.pillars.lfDelta !== null ? ` (${data.pillars.lfDelta > 0 ? '+' : ''}${data.pillars.lfDelta} MoM)` : ''}`);
    parts.push(`Strongest: ${data.pillars.strongest} | Weakest: ${data.pillars.weakest}`);
    parts.push('');

    // VibeLines collected — the narrative gold
    const allVibes = data.sessions
      .filter(s => s.vibeLine)
      .map(s => ({
        date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        vibe: s.vibeLine!,
        score: s.devotionScore,
      }));
    if (allVibes.length > 0) {
      parts.push('## VibeLines — the client\'s own sealed words (quote from these)');
      for (const v of allVibes) {
        parts.push(`- ${v.date} (${v.score}): "${v.vibe}"`);
      }
      parts.push('');
    }

    // Milestones — filtered, no volume/tonnage
    const milestones = data.milestones.filter(m =>
      !['volumePR', 'totalVolumeVsPrev', 'heaviestLift'].includes(m.type)
    );
    if (milestones.length > 0) {
      parts.push('## Notable moments');
      for (const m of milestones) {
        parts.push(`- ${m.label}: ${m.detail}`);
      }
      parts.push('');
    }

    return parts.join('\n');
  }
}
