import { renderHook, act } from '@testing-library/react';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

// Mock requestAnimationFrame to run synchronously
let rafCallbacks: ((time: number) => void)[] = [];
let rafId = 0;

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
  jest.useFakeTimers();
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return ++rafId;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function flushRAF(timestamp: number) {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  cbs.forEach((cb) => cb(timestamp));
}

describe('useAnimatedValue', () => {
  it('returns `to` immediately when from === to', () => {
    const { result } = renderHook(() => useAnimatedValue(50, 50));
    expect(result.current).toBe(50);
    // No rAF should have been scheduled
    expect(rafCallbacks).toHaveLength(0);
  });

  it('starts at `from` value before delay elapses', () => {
    const { result } = renderHook(() => useAnimatedValue(0, 100, 800, 200));
    expect(result.current).toBe(0);
  });

  it('animates towards `to` after delay and rAF ticks', () => {
    const { result } = renderHook(() => useAnimatedValue(0, 100, 800, 0));

    // Advance past delay
    act(() => {
      jest.advanceTimersByTime(0);
    });

    // First rAF at t=0
    act(() => flushRAF(0));
    // Second rAF at t=800 (end of animation)
    act(() => flushRAF(800));

    expect(result.current).toBe(100);
  });

  it('handles negative direction (counting down)', () => {
    const { result } = renderHook(() => useAnimatedValue(100, 0, 800, 0));

    act(() => {
      jest.advanceTimersByTime(0);
    });

    act(() => flushRAF(0));
    act(() => flushRAF(800));

    expect(result.current).toBe(0);
  });
});
