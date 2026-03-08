import type { NarrativePlan } from './types';
import type { ChronicleChapterContent } from '@/lib/types/chronicle';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * validateLLMOutput — checks LLM response against plan constraints.
 */
export function validateLLMOutput(
  plan: NarrativePlan,
  output: Partial<ChronicleChapterContent>
): ValidationResult {
  const errors: string[] = [];

  // All required fields present
  const required: (keyof ChronicleChapterContent)[] = [
    'title', 'verdict', 'ordeal', 'earnedTruth', 'numbers', 'nextTest',
  ];
  for (const field of required) {
    if (!output[field] && field !== 'carryForward' && field !== 'threshold' && field !== 'rhythmCalendar') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Title <= 6 words
  if (output.title) {
    const wordCount = output.title.trim().split(/\s+/).length;
    if (wordCount > 6) {
      errors.push(`Title has ${wordCount} words (max 6): "${output.title}"`);
    }
  }

  // Verdict has conjunction
  if (output.verdict) {
    const hasConjunction = /\b(but|and|yet|however|though|while)\b/i.test(output.verdict);
    if (!hasConjunction) {
      errors.push('Verdict missing conjunction (but/and/yet/however/though/while)');
    }
  }

  // Numbers has a markdown table with 3 rows
  if (output.numbers) {
    const tableRows = output.numbers.split('\n').filter(l => l.trim().startsWith('|') && !/^\|[\s\-:|]+\|$/.test(l.trim()));
    // Should have header + 3 data rows = 4 total pipe-starting lines (excluding separator)
    const dataRows = tableRows.slice(1); // skip header
    if (dataRows.length !== 3) {
      errors.push(`Numbers table should have exactly 3 data rows, found ${dataRows.length}`);
    }
  }

  // No banned phrases
  if (plan.style.bannedPhrases.length > 0) {
    const fullText = [output.title, output.verdict, output.ordeal, output.earnedTruth, output.nextTest]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    for (const phrase of plan.style.bannedPhrases) {
      if (fullText.includes(phrase.toLowerCase())) {
        errors.push(`Banned phrase found: "${phrase}"`);
      }
    }
  }

  // Fox state matches canon (if mentioned in numbers)
  if (output.numbers) {
    const expectedState = plan.numbers.foxStateEnd;
    if (!output.numbers.includes(expectedState)) {
      errors.push(`Numbers table doesn't contain expected fox state: ${expectedState}`);
    }
  }

  // carryForward should be present if plan has it, null otherwise
  if (plan.sections.carryForward && !output.carryForward) {
    errors.push('carryForward should be present (plan has continuity bridge)');
  }

  // threshold should be present if plan has it
  if (plan.sections.threshold && !output.threshold) {
    errors.push('threshold should be present (plan has threshold event)');
  }

  return { valid: errors.length === 0, errors };
}
