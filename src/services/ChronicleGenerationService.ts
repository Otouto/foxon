import Anthropic from '@anthropic-ai/sdk';
import type { ChronicleDataPayload } from '@/lib/types/chronicle';

const SYSTEM_PROMPT = `You are the Fox Chronicle narrator — a thoughtful, literary storyteller who writes monthly workout summaries in second person. You write with the warmth of a personal journal and the precision of a coach.

## Voice & Tone
- Second person ("You came back on a Monday")
- Present tense for session beats, past tense for summaries
- Honest, never generic motivational. If the month was rough, say so with compassion
- The fox metaphor is subtle — it's the app's spirit animal, not every paragraph
- Weave the user's own vibeLines (their sealed session reflections) naturally into the text using quotes

## Structure — Follow this EXACT section order

### 1. Previously... (2-3 sentences)
Brief recap of the prior month: session count, avg devotion, fox state, mood. If no prior month data, skip this section.

### 2. Chapter Opening (2-3 sentences)
Set the scene for this month. Reference the first session date, the workout name, and the opening vibe.

### 3. Week-by-Week Beats (3-5 sentences per week)
Walk through each week chronologically. For each week:
- Reference specific dates, workout names, and scores
- Quote at least one vibeLine per week if available
- Note effort levels and any comebacks or dips
- Mention PRs, volume milestones, or load changes when they happen
- Be specific about exercises and weights when load data is available

### 4. The Arc (ASCII visual)
Create a simple week-by-week progress bar using Unicode blocks (█ and ░). Show score range and a one-line summary per week. Example format:
\`\`\`
Week 1  ██████████░░░░  82 → 88       Returned. Found footing.
Week 2  █████████████░  91 → 94       Breakthrough. 3 sessions.
\`\`\`
Scale the filled blocks proportionally: 14 blocks total, fill based on avg devotion (70=7, 80=10, 90=12, 95+=13, 100=14).

### 5. By the Numbers (Markdown table)
Month-over-month comparison table with these rows:
| Metric | Previous Month | This Month | Delta |
Sessions, Avg Devotion, Best Score, Fox State, Weeks at Goal, Total Volume.
Use actual numbers from the data. Show deltas with +/- signs.

### 6. The Pillars (1 paragraph)
Analyze the four devotion pillars (EC, SC, RF, LF). Name the strongest and weakest. Compare to last month. Be specific about what the weakest pillar means in practical terms.

### 7. Closing Edge (2-3 sentences)
One specific, actionable focus for next month based on the weakest area. End with a short, memorable fox-themed closing line. Not cheesy — earned and quiet.

## Rules
- NEVER invent data. Only reference scores, dates, exercises, vibeLines that exist in the payload
- NEVER use generic motivational clichés ("You got this!", "Keep pushing!", "Every rep counts!")
- ALWAYS quote at least 3 vibeLines from the session data (using "quotes")
- ALWAYS include the MoM comparison table in section 5
- ALWAYS include the Arc visual in section 4
- Keep total output between 600-1000 words
- Use the user's actual workout titles (they may be in Ukrainian — that's fine, keep them as-is)
- Format output as clean Markdown

## Load & Volume Integration
When load data is available:
- Mention specific weights and exercises in weekly beats ("pressed 80kg for the first time")
- Note load progression trends ("squat weights climbed from 70 to 80 across the month")
- Reference total volume in the Numbers table
- If LF is the weakest pillar, the closing edge should address it`;

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

    // Use the title from narrative inputs (computed from data)
    const title = data.narrativeInputs.chapterTitle;

    return { title, contentMd };
  }

  /**
   * Build the user prompt with all chronicle data
   */
  private static buildUserPrompt(data: ChronicleDataPayload): string {
    const parts: string[] = [];

    parts.push(`Write Chapter ${data.timeFrame.chapterNumber} of the Fox Chronicle for ${data.userName}.`);
    parts.push(`Month: ${data.timeFrame.monthName}`);
    parts.push(`Suggested chapter title: "${data.narrativeInputs.chapterTitle}"`);
    parts.push(`Dominant theme: ${data.narrativeInputs.dominantTheme}`);
    parts.push(`Trajectory: ${data.narrativeInputs.trajectoryDirection}`);
    parts.push(`Load narrative: ${data.narrativeInputs.loadNarrative}`);
    parts.push(`Volume story: ${data.narrativeInputs.volumeStoryBeat}`);
    parts.push(`Emotional arc: ${data.narrativeInputs.emotionalArc}`);
    parts.push(`Closing edge suggestion: ${data.narrativeInputs.closingEdge}`);
    parts.push('');

    // Previous month
    if (data.previousMonth) {
      parts.push('## Previous Month Data');
      parts.push(JSON.stringify(data.previousMonth, null, 2));
      parts.push('');
    }

    // Current month headline
    parts.push('## Current Month Summary');
    parts.push(JSON.stringify(data.currentMonth, null, 2));
    parts.push('');

    // Sessions (the core narrative material)
    parts.push('## Sessions (chronological)');
    for (const session of data.sessions) {
      parts.push(`### ${session.dayOfWeek}, ${new Date(session.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — ${session.timeOfDay}`);
      parts.push(`Workout: ${session.workoutTitle || 'Custom'}`);
      parts.push(`Score: ${session.devotionScore} (${session.devotionGrade}) — "${session.devotionLabel}"`);
      if (session.effort) parts.push(`Effort: ${session.effort}`);
      if (session.vibeLine) parts.push(`Vibe line: "${session.vibeLine}"`);
      if (session.note) parts.push(`Note: "${session.note}"`);
      parts.push(`Volume: ${session.sessionVolume}kg`);
      if (session.heaviestLift) {
        parts.push(`Heaviest: ${session.heaviestLift.exercise} ${session.heaviestLift.load}kg × ${session.heaviestLift.reps}`);
      }
      if (session.restDaysBefore !== null) parts.push(`Rest days before: ${session.restDaysBefore}`);
      if (session.isComeback) parts.push('⚡ COMEBACK SESSION');
      parts.push(`Pillars: EC=${session.pillars.EC}, SC=${session.pillars.SC}, RF=${session.pillars.RF}${session.pillars.LF !== undefined ? `, LF=${session.pillars.LF}` : ''}`);
      // Exercise loads
      if (session.exerciseLoads.length > 0) {
        parts.push('Exercises:');
        for (const ex of session.exerciseLoads) {
          const setStr = ex.sets.map(s => `${s.load}kg×${s.reps}`).join(', ');
          parts.push(`  - ${ex.name}: ${setStr}`);
        }
      }
      parts.push('');
    }

    // Week summaries
    parts.push('## Week Summaries');
    for (const week of data.weeks) {
      parts.push(`Week ${week.number}: ${week.sessionCount} sessions, avg ${week.avgDevotion}, range ${week.scoreRange}, volume ${week.totalVolume}kg — "${week.miniArc}"`);
    }
    parts.push('');

    // Pillar analysis
    parts.push('## Pillar Analysis');
    parts.push(JSON.stringify(data.pillars, null, 2));
    parts.push('');

    // Exercise insights
    parts.push('## Exercise Insights');
    for (const ex of data.exercises) {
      const pr = ex.isPR ? ' ⭐ PR' : '';
      parts.push(`- ${ex.name} (${ex.muscleGroup || 'N/A'}): ${ex.sessionCount} sessions, peak ${ex.peakLoad}kg, avg ${ex.avgLoad}kg, trend: ${ex.loadTrend}, volume ${ex.totalVolume}kg${pr}`);
      if (ex.loadProgression.length > 1) {
        parts.push(`  Progression: ${ex.loadProgression.join(' → ')}`);
      }
    }
    parts.push('');

    // Rhythm
    parts.push('## Rhythm & Patterns');
    parts.push(JSON.stringify(data.rhythm, null, 2));
    parts.push('');

    // Milestones
    parts.push('## Milestones');
    for (const m of data.milestones) {
      parts.push(`- [${m.type}] ${m.label}: ${m.detail}`);
    }
    parts.push('');

    return parts.join('\n');
  }
}
