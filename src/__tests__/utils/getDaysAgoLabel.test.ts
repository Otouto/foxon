import { getDaysAgoLabel } from '@/lib/utils/dateUtils';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

describe('getDaysAgoLabel', () => {
  it('returns "Today" for a date with the same calendar day', () => {
    expect(getDaysAgoLabel(new Date())).toBe('Today');
  });

  it('returns "Today" regardless of the time of day', () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    expect(getDaysAgoLabel(startOfDay)).toBe('Today');
    expect(getDaysAgoLabel(endOfDay)).toBe('Today');
  });

  it('returns "Yesterday" for exactly 1 calendar day ago', () => {
    expect(getDaysAgoLabel(daysAgo(1))).toBe('Yesterday');
  });

  it('returns "2 days ago" for 2 calendar days ago', () => {
    expect(getDaysAgoLabel(daysAgo(2))).toBe('2 days ago');
  });

  it('returns "7 days ago" for a week ago', () => {
    expect(getDaysAgoLabel(daysAgo(7))).toBe('7 days ago');
  });

  it('returns "30 days ago" for 30 days ago', () => {
    expect(getDaysAgoLabel(daysAgo(30))).toBe('30 days ago');
  });

  it('accepts a Date whose time component is non-midnight (uses calendar day, not 24h window)', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    pastDate.setHours(23, 59, 59, 999);
    expect(getDaysAgoLabel(pastDate)).toBe('3 days ago');
  });
});
