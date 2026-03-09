import { Resend } from 'resend';
import type { ChronicleChapterContent } from '@/lib/types/chronicle';
import { renderInlineMarkdown, renderMarkdown } from '@/lib/chronicle-markdown';

interface ChronicleEmailData {
  to: string;
  chapterNumber: number;
  title: string;
  contentMd: string;
  monthName: string; // "February 2026"
  userName: string;
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
   * Render the full email HTML
   */
  static renderEmailHtml(data: ChronicleEmailData): string {
    const chapter = parseContent(data.contentMd);
    if (!chapter) {
      return `<p>Unable to render chronicle content.</p>`;
    }

    const contentHtml = this.renderChapterHtml(chapter);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chapter ${data.chapterNumber}: ${this.escapeHtml(data.title)}</title>
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
    .verdict {
      font-size: 16px;
      font-weight: 500;
      color: #111827;
      line-height: 1.7;
      margin: 0 0 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .carry-forward {
      border-left: 3px solid #fbbf24;
      padding: 8px 14px;
      margin: 0 0 24px;
      font-size: 14px;
      font-style: italic;
      color: #6b7280;
      line-height: 1.7;
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
      margin: 0 0 12px;
      line-height: 1.75;
    }
    .section p:last-child { margin-bottom: 0; }
    .section blockquote {
      border-left: 4px solid #a3e635;
      margin: 10px 0;
      padding: 8px 14px;
      color: #374151;
      font-style: italic;
      background: #f7fee7;
      border-radius: 0 8px 8px 0;
      font-size: 15px;
      line-height: 1.7;
    }
    .section .chronicle-table-wrapper {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      margin: 0;
    }
    .section table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .section th {
      text-align: left;
      padding: 8px 12px;
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
      font-weight: 600;
      color: #6b7280;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
    .section td {
      padding: 8px 12px;
      border-bottom: 1px solid #f3f4f6;
      color: #4b5563;
    }
    .section tr:last-child td { border-bottom: none; }
    .section td.row-label { font-weight: 600; color: #374151; white-space: nowrap; }
    .section strong { color: #111827; font-weight: 700; }
    .section em { font-style: italic; }
    .earned-truth {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      padding: 14px 16px;
      margin: 0 0 24px;
    }
    .earned-truth p {
      font-size: 15px;
      color: #065f46;
      margin: 0;
      line-height: 1.75;
    }
    .next-test {
      font-size: 15px;
      color: #374151;
      line-height: 1.7;
      margin: 0;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
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
   * Render the structured chapter as email HTML
   */
  private static renderChapterHtml(chapter: ChronicleChapterContent): string {
    const parts: string[] = [];

    // Verdict
    parts.push(`<p class="verdict">${renderInlineMarkdown(chapter.verdict)}</p>`);

    // Carry Forward — conditional
    if (chapter.carryForward) {
      parts.push(`<div class="carry-forward">${renderInlineMarkdown(chapter.carryForward)}</div>`);
    }

    // Threshold — conditional
    if (chapter.threshold) {
      parts.push(`<div class="section">
  <div class="section-title">The Threshold</div>
  ${renderMarkdown(chapter.threshold)}
</div>`);
    }

    // Ordeal
    parts.push(`<div class="section">
  <div class="section-title">The Ordeal</div>
  ${renderMarkdown(chapter.ordeal)}
</div>`);

    // Earned Truth
    parts.push(`<div class="earned-truth">
  <div class="section-title" style="color: #065f46;">Earned Truth</div>
  <p>${renderInlineMarkdown(chapter.earnedTruth)}</p>
</div>`);

    // Numbers
    parts.push(`<div class="section">
  <div class="section-title">The Numbers</div>
  ${renderMarkdown(chapter.numbers)}
</div>`);

    // Next Test
    parts.push(`<p class="next-test"><strong style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">The Next Test</strong><br>${renderInlineMarkdown(chapter.nextTest)}</p>`);

    return parts.join('\n');
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
