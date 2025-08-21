/**
 * Human verdict system for devotion scores
 */

export interface DevotionVerdict {
  verdict: string
  ctaHint?: string
}

/**
 * Get human-readable verdict and CTA hint based on devotion score
 */
export function getDevotionVerdict(score: number): DevotionVerdict {
  if (score >= 90) {
    return {
      verdict: "Nailed it. Disciplined work.",
      ctaHint: "Same plan next time."
    }
  }
  
  if (score >= 80) {
    return {
      verdict: "Strong session. Mostly on script."
    }
  }
  
  if (score >= 70) {
    return {
      verdict: "Work done, a bit messy."
    }
  }
  
  return {
    verdict: "Off rhythm, small reset next time.",
    ctaHint: "Consider 1 fewer set."
  }
}

/**
 * Get ring color based on score
 */
export function getRingColor(score: number): {
  primary: string
  background: string
  text: string
} {
  if (score >= 90) {
    return {
      primary: 'stroke-green-500',
      background: 'stroke-green-100',
      text: 'text-green-600'
    }
  }
  
  if (score >= 80) {
    return {
      primary: 'stroke-lime-500',
      background: 'stroke-lime-100',
      text: 'text-lime-600'
    }
  }
  
  if (score >= 70) {
    return {
      primary: 'stroke-amber-500',
      background: 'stroke-amber-100',
      text: 'text-amber-600'
    }
  }
  
  return {
    primary: 'stroke-red-500',
    background: 'stroke-red-100',
    text: 'text-red-600'
  }
}
