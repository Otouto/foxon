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
          background: #1f2937;
          color: #d1d5db;
          border-radius: 0.5rem;
          padding: 1rem;
          font-size: 0.8125rem;
          font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
          overflow-x: auto;
          line-height: 1.5;
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
        .chronicle-content :global(table) {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.8125rem;
        }
        .chronicle-content :global(th) {
          text-align: left;
          padding: 0.5rem 0.75rem;
          background: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
          font-weight: 600;
          color: #374151;
        }
        .chronicle-content :global(td) {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #f3f4f6;
          color: #4b5563;
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
      const cells = row.split('|').filter(c => c.trim() !== '');
      const tag = idx === 0 ? 'th' : 'td';
      table += '<tr>';
      cells.forEach(cell => {
        table += `<${tag}>${cell.trim()}</${tag}>`;
      });
      table += '</tr>';
    });
    table += '</table>';
    return table;
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
