/**
 * Shared markdown renderer for Chronicle field content.
 * Pure TypeScript — no framework dependencies.
 * Used by both the web renderer (via dangerouslySetInnerHTML) and
 * the email service (direct HTML string interpolation).
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Inline-only markdown: bold and italic.
 * Safe to use inside existing <p>, <td>, or <blockquote> tags.
 * Input text is HTML-escaped before processing.
 */
export function renderInlineMarkdown(text: string): string {
  let html = escapeHtml(text);
  // Bold before italic to avoid mis-matching **...*
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return html;
}

/**
 * Block-level markdown renderer.
 * Handles: markdown tables, blockquotes, paragraphs.
 * Inline bold/italic is applied within each block.
 *
 * Designed for Chronicle field values — not a general-purpose parser.
 */
export function renderMarkdown(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  const output: string[] = [];
  let tableLines: string[] = [];

  const flushTable = () => {
    if (tableLines.length === 0) return;
    output.push(renderMarkdownTable(tableLines));
    tableLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('|')) {
      tableLines.push(trimmed);
    } else {
      flushTable();

      if (trimmed === '') {
        // skip blank lines between blocks
      } else if (trimmed.startsWith('> ')) {
        output.push(`<blockquote>${renderInlineMarkdown(trimmed.slice(2))}</blockquote>`);
      } else {
        output.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
      }
    }
  }

  flushTable();

  return output.join('\n');
}

function renderMarkdownTable(lines: string[]): string {
  const dataRows = lines.filter(l => !/^\|[\s\-:|]+\|$/.test(l));
  if (dataRows.length === 0) return '';

  let html = '<div class="chronicle-table-wrapper"><table>';

  dataRows.forEach((row, idx) => {
    const cells = row.split('|').slice(1, -1).map(c => c.trim());
    const isHeader = idx === 0;
    const tag = isHeader ? 'th' : 'td';
    html += '<tr>';
    cells.forEach((cell, cellIdx) => {
      const labelClass = !isHeader && cellIdx === 0 ? ' class="row-label"' : '';
      html += `<${tag}${labelClass}>${renderInlineMarkdown(cell)}</${tag}>`;
    });
    html += '</tr>';
  });

  html += '</table></div>';
  return html;
}
