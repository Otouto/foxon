/**
 * Fox character quote selection for session summary
 * Deterministic per session (stable across re-renders) using score as seed
 */

export interface WeekProgress {
  completed: number
  planned: number
}

export interface FoxQuote {
  line: string
  weekLine?: string
}

const SCORE_LINES: Record<string, string[]> = {
  elite: [
    "I'd clap but I have paws.",
    "You almost made me sweat watching that.",
    "Even my tail is wagging.",
  ],
  solid: [
    "Solid session. I'll allow it.",
    "Not bad for a human.",
    "My whiskers approve.",
  ],
  decent: [
    "Showed up. That's half the battle.",
    "A bit rough, but fur real — you tried.",
    "I've seen worse. I've also seen better.",
  ],
  low: [
    "We don't talk about this one.",
    "Even I skip leg day sometimes.",
    "Shake it off. Literally, like a wet fox.",
  ],
}

function getScoreTier(score: number): string {
  if (score >= 90) return 'elite'
  if (score >= 80) return 'solid'
  if (score >= 70) return 'decent'
  return 'low'
}

/**
 * Deterministic pick: uses score to select a stable index
 */
function pickLine(lines: string[], score: number): string {
  return lines[Math.floor(score) % lines.length]
}

function getWeekLine(week: WeekProgress): string {
  const { completed, planned } = week

  // Over goal
  if (completed > planned) {
    return "Extra credit? Show-off. I like it."
  }

  // Just hit goal
  if (completed === planned) {
    return "Weekly goal crushed! Nap time?"
  }

  // First session of the week
  if (completed === 1) {
    const remaining = planned - 1
    return `Week's just starting. ${remaining} more to go!`
  }

  // Mid-week, on track
  const remaining = planned - completed
  return `${completed} down, ${remaining} left. Keep rolling.`
}

export function getFoxQuote(score: number, week?: WeekProgress): FoxQuote {
  const tier = getScoreTier(score)
  const lines = SCORE_LINES[tier]
  const line = pickLine(lines, score)

  return {
    line,
    weekLine: week ? getWeekLine(week) : undefined,
  }
}
