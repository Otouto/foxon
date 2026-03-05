import { prisma } from '@/lib/prisma';
import { ChronicleDataService } from './ChronicleDataService';
import { ChronicleGenerationService } from './ChronicleGenerationService';
import { ChronicleEmailService } from './ChronicleEmailService';
import type { ChronicleChapterContent } from '@/lib/types/chronicle';

export interface ChronicleListItem {
  id: string;
  month: number;
  year: number;
  chapterNumber: number;
  title: string;
  emailSentAt: Date | null;
  createdAt: Date;
}

export class ChronicleService {
  /**
   * Generate a chronicle for a given month/year, store it, and optionally email it
   */
  static async generateAndStore(
    userId: string,
    month: number,
    year: number,
    options?: { sendEmail?: boolean }
  ): Promise<{ id: string; title: string }> {
    // Check if chronicle already exists (for regeneration case)
    const existing = await prisma.foxChronicle.findUnique({
      where: { userId_month_year: { userId, month, year } },
    });

    // Step 1: Compute data
    const dataPayload = await ChronicleDataService.computeChronicleData(userId, month, year);

    // Step 1b: Fetch previous chapter's "return" for narrative continuity
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevChronicle = await prisma.foxChronicle.findFirst({
      where: { userId, month: prevMonth, year: prevYear },
      select: { contentMd: true },
    });
    if (prevChronicle) {
      try {
        const parsed = JSON.parse(prevChronicle.contentMd) as ChronicleChapterContent;
        if (parsed.return) {
          dataPayload.previousChapterReturn = parsed.return;
        }
      } catch { /* legacy format — no return to extract */ }
    }

    // Step 2: Generate narrative via Claude (keep old record alive during this)
    const { title, contentMd } = await ChronicleGenerationService.generateChronicle(dataPayload);

    // Step 3: Render HTML for email
    const contentHtml = ChronicleEmailService.renderEmailHtml({
      to: '',
      chapterNumber: dataPayload.timeFrame.chapterNumber,
      title,
      contentMd,
      monthName: dataPayload.timeFrame.monthName,
      userName: dataPayload.userName,
    });

    // Step 4: Delete old record only after generation succeeds, right before creating the new one
    if (existing) {
      await prisma.foxChronicle.delete({ where: { id: existing.id } });
    }

    // Step 5: Store in database
    const chronicle = await prisma.foxChronicle.create({
      data: {
        userId,
        month,
        year,
        chapterNumber: dataPayload.timeFrame.chapterNumber,
        title,
        contentMd,
        contentHtml,
        dataPayload: JSON.parse(JSON.stringify(dataPayload)),
      },
    });

    // Step 6: Optionally send email
    if (options?.sendEmail) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        await this.sendChronicleEmail(chronicle.id);
      }
    }

    return { id: chronicle.id, title };
  }

  /**
   * Send or re-send chronicle email
   */
  static async sendChronicleEmail(chronicleId: string): Promise<void> {
    const chronicle = await prisma.foxChronicle.findUnique({
      where: { id: chronicleId },
      include: { user: true },
    });

    if (!chronicle) throw new Error('Chronicle not found');
    if (!chronicle.user.email) throw new Error('User has no email set');

    await ChronicleEmailService.sendChronicleEmail({
      to: chronicle.user.email,
      chapterNumber: chronicle.chapterNumber,
      title: chronicle.title,
      contentMd: chronicle.contentMd,
      monthName: `${monthName(chronicle.month)} ${chronicle.year}`,
      userName: chronicle.user.displayName || 'Fox',
    });

    await prisma.foxChronicle.update({
      where: { id: chronicleId },
      data: { emailSentAt: new Date() },
    });
  }

  /**
   * List all chronicles for a user
   */
  static async listChronicles(userId: string): Promise<ChronicleListItem[]> {
    return prisma.foxChronicle.findMany({
      where: { userId },
      select: {
        id: true,
        month: true,
        year: true,
        chapterNumber: true,
        title: true,
        emailSentAt: true,
        createdAt: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  /**
   * Get a single chronicle by ID
   */
  static async getChronicle(id: string) {
    return prisma.foxChronicle.findUnique({
      where: { id },
    });
  }

  /**
   * Delete a chronicle by ID
   */
  static async deleteChronicle(id: string): Promise<void> {
    await prisma.foxChronicle.delete({ where: { id } });
  }

  /**
   * Generate chronicles for all users with email (for cron job)
   */
  static async generateMonthlyChronicles(): Promise<{
    generated: number;
    errors: string[];
  }> {
    // Generate for the previous month
    const now = new Date();
    const targetMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // Previous month
    const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    const users = await prisma.user.findMany({
      where: { email: { not: null } },
    });

    let generated = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        await this.generateAndStore(user.id, targetMonth, targetYear, {
          sendEmail: true,
        });
        generated++;
      } catch (error) {
        errors.push(`User ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { generated, errors };
  }
}

function monthName(month: number): string {
  const names = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return names[month] || '';
}
