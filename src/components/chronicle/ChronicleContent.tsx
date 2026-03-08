'use client';

import type { ChronicleChapterContent } from '@/lib/types/chronicle';
import { renderInlineMarkdown, renderMarkdown } from '@/lib/chronicle-markdown';

interface ChronicleContentProps {
  contentMd: string;
}

function parseContent(contentMd: string): ChronicleChapterContent | null {
  try {
    const parsed = JSON.parse(contentMd) as Record<string, unknown>;
    if ('verdict' in parsed) return parsed as unknown as ChronicleChapterContent;
    return null;
  } catch {
    return null;
  }
}

export default function ChronicleContent({ contentMd }: ChronicleContentProps) {
  const chapter = parseContent(contentMd);

  if (!chapter) {
    return (
      <div className="text-sm text-gray-400 italic p-4">
        Unable to parse chronicle content.
      </div>
    );
  }

  return <ChapterRenderer chapter={chapter} />;
}

// ─── Chapter Renderer ────────────────────────────────────────────────────────

const SECTION_LABEL = 'text-[0.625rem] font-bold text-gray-400 uppercase tracking-widest mb-2.5';
const SECTION_TEXT = 'text-[0.9375rem] leading-relaxed text-gray-600';

function ChapterRenderer({ chapter }: { chapter: ChronicleChapterContent }) {
  return (
    <div className="text-[0.9375rem] leading-relaxed text-gray-600">

      {/* Verdict */}
      <section className="mb-6 pb-5 border-b border-gray-100">
        <p className={SECTION_LABEL}>Verdict</p>
        <p
          className="text-base font-medium text-gray-900 leading-[1.7] m-0"
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(chapter.verdict) }}
        />
      </section>

      {/* Carry Forward — conditional */}
      {chapter.carryForward && (
        <section className="mb-6">
          <p className={SECTION_LABEL}>Carry Forward</p>
          <div className="border-l-2 border-amber-300 pl-3">
            <p
              className="text-sm italic text-gray-500 m-0"
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(chapter.carryForward) }}
            />
          </div>
        </section>
      )}

      {/* Threshold — conditional */}
      {chapter.threshold && (
        <section className="mb-6 chronicle-fields">
          <p className={SECTION_LABEL}>The Threshold</p>
          <div
            className={SECTION_TEXT}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(chapter.threshold) }}
          />
        </section>
      )}

      {/* Ordeal */}
      <section className="mb-6 chronicle-fields">
        <p className={SECTION_LABEL}>The Ordeal</p>
        <div
          className={SECTION_TEXT}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(chapter.ordeal) }}
        />
      </section>

      {/* Earned Truth */}
      <section className="mb-6">
        <p className={SECTION_LABEL}>Earned Truth</p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <p
            className="text-[0.9375rem] leading-relaxed text-emerald-900 m-0"
            dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(chapter.earnedTruth) }}
          />
        </div>
      </section>

      {/* Numbers */}
      <section className="mb-6 chronicle-fields">
        <p className={SECTION_LABEL}>The Numbers</p>
        <div
          className={SECTION_TEXT}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(chapter.numbers) }}
        />
      </section>

      {/* Rhythm — calendar only */}
      <section className="mb-6">
        <p className={SECTION_LABEL}>Rhythm</p>
        {chapter.rhythmCalendar && <RhythmCalendarGrid text={chapter.rhythmCalendar} />}
      </section>

      {/* Next Test */}
      <section className="pt-5 border-t border-gray-100">
        <p className={SECTION_LABEL}>The Next Test</p>
        <p
          className={`${SECTION_TEXT} m-0`}
          dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(chapter.nextTest) }}
        />
      </section>

    </div>
  );
}

// ─── Rhythm Calendar — pure React with Tailwind ──────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CalRow { label: string; slots: boolean[]; countText: string }

function parseCalendarRows(text: string): CalRow[] {
  const lines = text.split('\n').filter(l => l.length > 0);
  const rows: CalRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const label = line.substring(0, 9).trim();
    const slots: boolean[] = [];
    for (let j = 0; j < 7; j++) {
      const slot = line.substring(9 + j * 4, 13 + j * 4);
      slots.push(slot.trim() !== '');
    }
    const countText = line.substring(37).trim();
    rows.push({ label, slots, countText });
  }
  return rows;
}

function RhythmCalendarGrid({ text }: { text: string }) {
  const rows = parseCalendarRows(text);
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 overflow-x-auto mb-1">
      <div className="flex items-center pb-2 mb-0.5 border-b border-slate-200">
        <span className="w-[4.5rem] shrink-0" />
        {DAYS.map(d => (
          <span
            key={d}
            className="w-11 shrink-0 text-center text-[0.625rem] font-bold text-slate-400 uppercase tracking-wide"
          >
            {d}
          </span>
        ))}
        <span className="ml-2 w-20 shrink-0" />
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center py-0.5">
          <span className="w-[4.5rem] shrink-0 text-[0.6875rem] font-mono text-slate-500">
            {row.label}
          </span>
          {row.slots.map((active, j) => (
            <span key={j} className="w-11 shrink-0 h-7 flex items-center justify-center">
              {active && (
                <span className="w-2 h-2 rounded-full bg-slate-700 block" />
              )}
            </span>
          ))}
          <span className="ml-2 text-[0.6875rem] font-mono text-slate-400 whitespace-nowrap">
            {row.countText}
          </span>
        </div>
      ))}
    </div>
  );
}
