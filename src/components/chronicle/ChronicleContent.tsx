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

