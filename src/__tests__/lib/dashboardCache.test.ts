import { DashboardCache } from '@/lib/dashboardCache';

beforeEach(() => {
  sessionStorage.clear();
});

describe('DashboardCache', () => {
  describe('FoxState', () => {
    it('returns null when no cached value', () => {
      expect(DashboardCache.getFoxState()).toBeNull();
    });

    it('stores and retrieves fox state', () => {
      const data = { formScore: 72, attendance: 80, quality: 90, consistency: 60 };
      DashboardCache.setFoxState(data);
      expect(DashboardCache.getFoxState()).toEqual(data);
    });
  });

  describe('WeekProgress', () => {
    it('returns null when no cached value', () => {
      expect(DashboardCache.getWeekProgress()).toBeNull();
    });

    it('stores and retrieves week progress', () => {
      const data = { completed: 3, planned: 4 };
      DashboardCache.setWeekProgress(data);
      expect(DashboardCache.getWeekProgress()).toEqual(data);
    });
  });

  describe('LastSessionId', () => {
    it('returns null when no cached value', () => {
      expect(DashboardCache.getLastSessionId()).toBeNull();
    });

    it('stores and retrieves session id', () => {
      DashboardCache.setLastSessionId('abc-123');
      expect(DashboardCache.getLastSessionId()).toBe('abc-123');
    });
  });

  describe('graceful degradation', () => {
    it('returns null when sessionStorage throws on getItem', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(DashboardCache.getFoxState()).toBeNull();
      jest.restoreAllMocks();
    });

    it('does not throw when sessionStorage throws on setItem', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => {
        DashboardCache.setFoxState({ formScore: 50, attendance: 50, quality: 50, consistency: 50 });
      }).not.toThrow();
      jest.restoreAllMocks();
    });
  });
});
