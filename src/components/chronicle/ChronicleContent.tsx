'use client';

interface ChronicleContentProps {
  contentMd: string;
}

export default function ChronicleContent({ contentMd }: ChronicleContentProps) {
  return (
    <div className="chronicle-content prose prose-sm max-w-none">
      <div dangerouslySetInnerHTML={{ __html: markdownToHtml(contentMd) }} />
      <style jsx>{`
        .chronicle-content :global(h1) {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 1.5rem 0 0.75rem;
        }
        .chronicle-content :global(h2) {
          font-size: 1rem;
          font-weight: 700;
          color: #374151;
          margin: 1.5rem 0 0.5rem;
          padding-bottom: 0.375rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .chronicle-content :global(h3) {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #4b5563;
          margin: 1rem 0 0.5rem;
        }
        .chronicle-content :global(p) {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: #374151;
          margin: 0 0 0.75rem;
        }
        .chronicle-content :global(blockquote) {
          border-left: 3px solid #a3e635;
          margin: 0.75rem 0;
          padding: 0.25rem 1rem;
          color: #4b5563;
          font-style: italic;
          background: #f7fee7;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .chronicle-content :global(pre) {
          background: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-radius: 0.625rem;
          padding: 1rem 1.25rem;
          font-size: 0.8125rem;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          overflow-x: auto;
          line-height: 1.6;
          white-space: pre;
          margin: 0.75rem 0;
        }
        .chronicle-content :global(code) {
          background: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.8125rem;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
        }
        .chronicle-content :global(pre code) {
          background: none;
          padding: 0;
        }
        .chronicle-content :global(.rhythm-cal) {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          margin: 0.75rem 0;
          overflow-x: auto;
        }
        .chronicle-content :global(.rhythm-cal-row) {
          display: flex;
          align-items: center;
          padding: 0.1875rem 0;
        }
        .chronicle-content :global(.rhythm-cal-head) {
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 0.1875rem;
        }
        .chronicle-content :global(.rhythm-cal-label) {
          width: 4.5rem;
          flex-shrink: 0;
          font-size: 0.6875rem;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          color: #64748b;
        }
        .chronicle-content :global(.rhythm-cal-day-hdr) {
          width: 2.75rem;
          flex-shrink: 0;
          text-align: center;
          font-size: 0.625rem;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .chronicle-content :global(.rhythm-cal-cell) {
          width: 2.75rem;
          flex-shrink: 0;
          height: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chronicle-content :global(.rhythm-cal-dot) {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background: #334155;
          display: block;
        }
        .chronicle-content :global(.rhythm-cal-count) {
          margin-left: 0.5rem;
          font-size: 0.6875rem;
          color: #94a3b8;
          white-space: nowrap;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
        }
        .chronicle-content :global(.table-wrapper) {
          width: 100%;
          overflow-x: auto;
          margin: 1rem 0;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }
        .chronicle-content :global(table) {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8125rem;
        }
        .chronicle-content :global(th) {
          text-align: left;
          padding: 0.5rem 0.875rem;
          background: #f3f4f6;
          border-bottom: 2px solid #e5e7eb;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
        }
        .chronicle-content :global(th:first-child) {
          width: 30%;
        }
        .chronicle-content :global(td) {
          padding: 0.5rem 0.875rem;
          border-bottom: 1px solid #f3f4f6;
          color: #4b5563;
        }
        .chronicle-content :global(tr:last-child td) {
          border-bottom: none;
        }
        .chronicle-content :global(td.row-label) {
          font-weight: 600;
          color: #374151;
          white-space: nowrap;
        }
        .chronicle-content :global(strong) {
          color: #111827;
        }
        .chronicle-content :global(ul), .chronicle-content :global(ol) {
          padding-left: 1.25rem;
          margin: 0.5rem 0 0.75rem;
        }
        .chronicle-content :global(li) {
          font-size: 0.9375rem;
          color: #374151;
          margin: 0.25rem 0;
        }
        .chronicle-content :global(hr) {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
}

function markdownToHtml(md: string): string {
  let html = md;

  // Code blocks
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```\w*\n?/, '').replace(/\n?```$/, '');
    if (/Mon\s+Tue\s+Wed/.test(code)) {
      return renderRhythmCalendar(code);
    }
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  });

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Tables
  html = html.replace(/(\|.+\|\n)+/g, (tableBlock) => {
    const rows = tableBlock.trim().split('\n');
    if (rows.length < 2) return tableBlock;
    let table = '<table>';
    rows.forEach((row, idx) => {
      if (/^\|[\s\-:|]+\|$/.test(row)) return;
      const cells = row.split('|').slice(1, -1).map(c => c.trim());
      const tag = idx === 0 ? 'th' : 'td';
      table += '<tr>';
      cells.forEach((cell, cellIdx) => {
        const labelClass = tag === 'td' && cellIdx === 0 ? ' class="row-label"' : '';
        table += `<${tag}${labelClass}>${cell}</${tag}>`;
      });
      table += '</tr>';
    });
    table += '</table>';
    return `<div class="table-wrapper">${table}</div>`;
  });

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

  // Unordered lists
  html = html.replace(/(^- .+\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line =>
      `<li>${line.replace(/^- /, '')}</li>`
    ).join('');
    return `<ul>${items}</ul>`;
  });

  // Paragraphs
  html = html.replace(/^(?!<[a-z])((?!<\/)[^\n]+)$/gm, '<p>$1</p>');
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

function renderRhythmCalendar(text: string): string {
  const lines = text.split('\n').filter(l => l.length > 0);
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  let html = '<div class="rhythm-cal">';

  // Header row
  html += '<div class="rhythm-cal-row rhythm-cal-head">';
  html += '<span class="rhythm-cal-label"></span>';
  DAYS.forEach(d => {
    html += `<span class="rhythm-cal-day-hdr">${d}</span>`;
  });
  html += '<span class="rhythm-cal-count"></span>';
  html += '</div>';

  // Week rows — skip the first line (header with Mon/Tue/Wed…)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Week label is the first 9 chars, slots are 4 chars each (7 slots = 28 chars)
    const label = line.substring(0, 9).trim();
    const slots: boolean[] = [];
    for (let j = 0; j < 7; j++) {
      const slot = line.substring(9 + j * 4, 13 + j * 4);
      // Any non-whitespace character counts as a session marker
      slots.push(slot.trim() !== '');
    }
    // Session count text sits after the 37 chars (9 + 28)
    const countText = line.substring(37).trim();

    html += '<div class="rhythm-cal-row">';
    html += `<span class="rhythm-cal-label">${escapeHtml(label)}</span>`;
    slots.forEach(active => {
      html += `<span class="rhythm-cal-cell">${active ? '<span class="rhythm-cal-dot"></span>' : ''}</span>`;
    });
    html += `<span class="rhythm-cal-count">${escapeHtml(countText)}</span>`;
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
