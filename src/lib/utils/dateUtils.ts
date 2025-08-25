export function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  }
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
}

export function formatDateWithWeekday(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

export interface PracticeTimeInfo {
  emoji: string;
  label: string;
}

export function getPracticeTimeInfo(date: Date): PracticeTimeInfo {
  const hour = date.getHours();
  
  if (hour >= 4 && hour < 7) {
    return { emoji: '🌅', label: 'Dawn practice' };
  } else if (hour >= 7 && hour < 12) {
    return { emoji: '☀️', label: 'Morning practice' };
  } else if (hour >= 12 && hour < 17) {
    return { emoji: '🌤️', label: 'Afternoon practice' };
  } else if (hour >= 17 && hour < 21) {
    return { emoji: '🌆', label: 'Evening practice' };
  } else {
    return { emoji: '🌙', label: 'Night practice' };
  }
}

export function getDevotionScoreLabel(score: number): string {
  if (score === 100) return 'Perfect Process';
  if (score >= 95) return 'Devoted';
  if (score >= 90) return 'Dialed In';
  if (score >= 85) return 'Solid Work';
  if (score >= 80) return 'Showed Up';
  return 'Practice';
}