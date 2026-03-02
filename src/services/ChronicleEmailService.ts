import { Resend } from 'resend';
import type { ChronicleChapterContent } from '@/lib/types/chronicle';

interface ChronicleEmailData {
  to: string;
  chapterNumber: number;
  title: string;
  contentMd: string;
  monthName: string; // "February 2026"
  userName: string;
}

function parseNewFormat(contentMd: string): ChronicleChapterContent | null {
  try {
    const parsed = JSON.parse(contentMd) as Record<string, unknown>;
    if ('verdict' in parsed) return parsed as unknown as ChronicleChapterContent;
    return null;
  } catch {
    return null;
  }
}

export class ChronicleEmailService {
  private static getClient(): Resend {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    return new Resend(apiKey);
  }

  /**
   * Send a chronicle email
   */
  static async sendChronicleEmail(data: ChronicleEmailData): Promise<{ id: string }> {
    const resend = this.getClient();
    const html = this.renderEmailHtml(data);
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Fox Chronicle <onboarding@resend.dev>';

    const result = await resend.emails.send({
      from: fromAddress,
      to: data.to,
      subject: `Chapter ${data.chapterNumber}: ${data.title}`,
      html,
    });

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    return { id: result.data?.id || 'unknown' };
  }

  /**
   * Render the full email HTML — auto-detects new vs legacy format
   */
  static renderEmailHtml(data: ChronicleEmailData): string {
    const chapter = parseNewFormat(data.contentMd);
    const contentHtml = chapter
      ? this.renderNewFormatHtml(chapter)
      : this.markdownToHtml(data.contentMd);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chapter ${data.chapterNumber}: ${data.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 640px;
      margin: 0 auto;
      padding: 40px 24px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #d1fae5;
    }
    .header-fox { font-size: 40px; margin-bottom: 8px; }
    .header-subtitle {
      font-size: 13px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }
    .header-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 8px 0 4px;
    }
    .header-month { font-size: 14px; color: #9ca3af; }
    .content {
      background: #ffffff;
      border-radius: 16px;
      padding: 32px 28px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f3f4f6;
    }
    /* ── New format styles ── */
    .verdict {
      font-size: 16px;
      font-weight: 500;
      color: #111827;
      line-height: 1.7;
      margin: 0 0 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .section { margin: 0 0 24px; }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 0 0 10px;
    }
    .section p {
      font-size: 15px;
      color: #374151;
      margin: 0;
      line-height: 1.75;
    }
    .rhythm-caption {
      font-size: 14px;
      color: #6b7280;
      font-style: italic;
      margin: 10px 0 0;
    }
    .rhythm-cal-email {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      font-size: 12px;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      line-height: 1.6;
      white-space: pre;
      overflow-x: auto;
      color: #1e293b;
    }
    .return-text {
      font-size: 15px;
      color: #374151;
      line-height: 1.7;
      margin: 0;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    /* ── Legacy format styles ── */
    .content h2 {
      font-size: 16px;
      font-weight: 700;
      color: #374151;
      margin: 28px 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .content h2:first-child { margin-top: 0; }
    .content h3 {
      font-size: 15px;
      font-weight: 600;
      color: #4b5563;
      margin: 20px 0 8px;
    }
    .content p { font-size: 15px; color: #374151; margin: 0 0 14px; }
    .content blockquote {
      border-left: 3px solid #a3e635;
      margin: 12px 0;
      padding: 4px 16px;
      color: #4b5563;
      font-style: italic;
      background: #f7fee7;
      border-radius: 0 8px 8px 0;
    }
    .content pre {
      background: #1f2937;
      color: #d1d5db;
      border-radius: 8px;
      padding: 16px;
      font-size: 13px;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      overflow-x: auto;
      line-height: 1.5;
    }
    .content code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    }
    .content pre code { background: none; padding: 0; }
    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 14px;
    }
    .content th {
      text-align: left;
      padding: 8px 12px;
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
      font-weight: 600;
      color: #374151;
    }
    .content td {
      padding: 8px 12px;
      border-bottom: 1px solid #f3f4f6;
      color: #4b5563;
    }
    .content tr:last-child td { border-bottom: none; }
    .content strong { color: #111827; }
    .content em { color: #6b7280; }
    .content ul, .content ol { padding-left: 20px; margin: 8px 0 14px; }
    .content li { font-size: 15px; color: #374151; margin: 4px 0; }
    /* ── Footer ── */
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .footer p { font-size: 12px; color: #9ca3af; margin: 4px 0; }
    .footer-fox { font-size: 20px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-fox">🦊</div>
      <div class="header-subtitle">Fox Chronicle</div>
      <div class="header-title">Chapter ${data.chapterNumber}: ${this.escapeHtml(data.title)}</div>
      <div class="header-month">${this.escapeHtml(data.monthName)}</div>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <div class="footer-fox">🦊</div>
      <p>Fox Chronicle — ${this.escapeHtml(data.userName)}'s journey</p>
      <p>Powered by Foxon</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Render the structured JSON format as email HTML
   */
  private static renderNewFormatHtml(chapter: ChronicleChapterContent): string {
    const parts: string[] = [];

    // Verdict — prominent, no header
    parts.push(`<p class="verdict">${this.escapeHtml(chapter.verdict)}</p>`);

    // Threshold — conditional
    if (chapter.threshold) {
      parts.push(`<div class="section">
  <div class="section-title">The Threshold</div>
  <p>${this.escapeHtml(chapter.threshold)}</p>
</div>`);
    }

    // Ordeal
    parts.push(`<div class="section">
  <div class="section-title">The Ordeal</div>
  <p>${this.escapeHtml(chapter.ordeal)}</p>
</div>`);

    // Numbers
    parts.push(`<div class="section">
  <div class="section-title">The Numbers</div>
  <p>${this.escapeHtml(chapter.numbers)}</p>
</div>`);

    // Rhythm — calendar as monospace pre + caption
    parts.push(`<div class="section">
  <div class="section-title">Rhythm</div>${chapter.rhythmCalendar ? `
  <pre class="rhythm-cal-email">${this.escapeHtml(chapter.rhythmCalendar)}</pre>` : ''}
  <p class="rhythm-caption">${this.escapeHtml(chapter.rhythmCaption)}</p>
</div>`);

    // Return — no header
    parts.push(`<p class="return-text">${this.escapeHtml(chapter.return)}</p>`);

    return parts.join('\n');
  }

  /**
   * Legacy markdown to HTML converter (for old format chronicles)
   */
  private static markdownToHtml(md: string): string {
    let html = md;

    // Code blocks (```...```)
    html = html.replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/, '').replace(/\n?```$/, '');
      return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
    });

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

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
    html = html.replace(/\n{3,}/g, '\n\n');

    return html;
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
