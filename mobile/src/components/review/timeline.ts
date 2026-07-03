import type { SessionReviewData } from '@/api/types';
import type { GroupSummary, SessionGroup } from '@/lib/dateUtils';

export type ReviewSession = Omit<SessionReviewData, 'date'> & { date: Date };

export type ConnectorTier = 'flush' | 'dots' | 'cluster' | 'break';

export interface ConnectorInfo {
  restDays: number;
  tier: ConnectorTier;
}

/**
 * A single activity on the Review timeline. Gym sessions today; future
 * integrations (football, tennis, flexibility from HealthKit) become new
 * variants here — buildTimeline and the connectors read only `date` on the
 * entry, never the payload.
 */
export type TimelineActivity = { type: 'gym'; session: ReviewSession };

export type TimelineEntry =
  | {
      kind: 'header';
      groupKey: string;
      groupType: 'week' | 'month';
      title: string;
      summary: GroupSummary;
    }
  | {
      kind: 'activity';
      groupKey: string;
      date: Date;
      activity: TimelineActivity;
      /** Gap down to the next (earlier) activity in the same group; null on the group's last entry. */
      connector: ConnectorInfo | null;
    };

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Calendar-day gap minus one: Jun 10 → Jun 17 leaves 6 rest days. */
function restDaysBetween(later: Date, earlier: Date): number {
  const a = new Date(later).setHours(0, 0, 0, 0);
  const b = new Date(earlier).setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((a - b) / MS_PER_DAY) - 1);
}

function connectorTier(restDays: number): ConnectorTier {
  if (restDays === 0) return 'flush';
  if (restDays <= 7) return 'dots';
  if (restDays <= 14) return 'cluster';
  return 'break';
}

/**
 * Flattens week/month groups into one virtualized list: a header entry per
 * group, followed by its activities unless the group is collapsed. Activities
 * arrive newest-first, so each connector describes the rest days down to the
 * next card; group headers provide the visual break between groups.
 */
export function buildTimeline(
  groups: SessionGroup<ReviewSession>[],
  collapsed: ReadonlySet<string>
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const group of groups) {
    entries.push({
      kind: 'header',
      groupKey: group.key,
      groupType: group.type,
      title: group.title,
      summary: group.summary,
    });

    if (collapsed.has(group.key)) continue;

    group.sessions.forEach((session, index) => {
      const next = group.sessions[index + 1];
      let connector: ConnectorInfo | null = null;
      if (next) {
        const restDays = restDaysBetween(session.date, next.date);
        connector = { restDays, tier: connectorTier(restDays) };
      }

      entries.push({
        kind: 'activity',
        groupKey: group.key,
        date: session.date,
        activity: { type: 'gym', session },
        connector,
      });
    });
  }

  return entries;
}
