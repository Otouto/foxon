// Mocks must be declared before imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    foxChronicle: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/services/ChronicleDataService', () => ({
  ChronicleDataService: {
    computeChronicleData: jest.fn(),
  },
}));

jest.mock('@/services/ChronicleGenerationService', () => ({
  ChronicleGenerationService: {
    generateChronicle: jest.fn(),
  },
}));

jest.mock('@/services/ChronicleEmailService', () => ({
  ChronicleEmailService: {
    renderEmailHtml: jest.fn().mockReturnValue('<html></html>'),
    sendChronicleEmail: jest.fn(),
  },
}));

import { ChronicleService } from '@/services/ChronicleService';
import { prisma } from '@/lib/prisma';
import { ChronicleDataService } from '@/services/ChronicleDataService';
import { ChronicleGenerationService } from '@/services/ChronicleGenerationService';

const mockDataPayload = {
  timeFrame: { chapterNumber: 5, monthName: 'February' },
  userName: 'TestFox',
};

const mockExistingChronicle = { id: 'old-id' };
const mockNewChronicle = { id: 'new-id', title: 'The Quiet Return' };

describe('ChronicleService.generateAndStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ChronicleDataService.computeChronicleData as jest.Mock).mockResolvedValue(mockDataPayload);
    (ChronicleGenerationService.generateChronicle as jest.Mock).mockResolvedValue({
      title: mockNewChronicle.title,
      contentMd: '{}',
    });
    (prisma.foxChronicle.create as jest.Mock).mockResolvedValue(mockNewChronicle);
  });

  describe('regeneration (existing chronicle present)', () => {
    beforeEach(() => {
      (prisma.foxChronicle.findUnique as jest.Mock).mockResolvedValue(mockExistingChronicle);
      (prisma.foxChronicle.delete as jest.Mock).mockResolvedValue(undefined);
    });

    it('does not delete the old record before AI generation completes', async () => {
      let deleteCalledBeforeGenerate = false;

      (ChronicleGenerationService.generateChronicle as jest.Mock).mockImplementation(async () => {
        deleteCalledBeforeGenerate =
          (prisma.foxChronicle.delete as jest.Mock).mock.calls.length > 0;
        return { title: mockNewChronicle.title, contentMd: '{}' };
      });

      await ChronicleService.generateAndStore('user-123', 2, 2026);

      expect(deleteCalledBeforeGenerate).toBe(false);
    });

    it('deletes the old record after AI generation succeeds', async () => {
      await ChronicleService.generateAndStore('user-123', 2, 2026);

      const deleteCalls = (prisma.foxChronicle.delete as jest.Mock).mock.invocationCallOrder[0];
      const createCalls = (prisma.foxChronicle.create as jest.Mock).mock.invocationCallOrder[0];

      expect(prisma.foxChronicle.delete).toHaveBeenCalledWith({
        where: { id: 'old-id' },
      });
      // delete must happen strictly before create
      expect(deleteCalls).toBeLessThan(createCalls);
    });

    it('does NOT delete the old record when AI generation throws', async () => {
      (ChronicleGenerationService.generateChronicle as jest.Mock).mockRejectedValue(
        new Error('Claude API unavailable')
      );

      await expect(
        ChronicleService.generateAndStore('user-123', 2, 2026)
      ).rejects.toThrow('Claude API unavailable');

      expect(prisma.foxChronicle.delete).not.toHaveBeenCalled();
    });
  });

  describe('first generation (no existing chronicle)', () => {
    beforeEach(() => {
      (prisma.foxChronicle.findUnique as jest.Mock).mockResolvedValue(null);
    });

    it('creates the new chronicle without calling delete', async () => {
      const result = await ChronicleService.generateAndStore('user-123', 2, 2026);

      expect(prisma.foxChronicle.delete).not.toHaveBeenCalled();
      expect(prisma.foxChronicle.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 'new-id', title: 'The Quiet Return' });
    });
  });
});
