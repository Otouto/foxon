/**
 * Debounced localStorage utility for performance optimization
 * Prevents excessive localStorage writes by batching updates
 */

interface DebounceEntry {
  timer: NodeJS.Timeout;
  data: unknown;
}

class DebouncedStorage {
  private pendingWrites = new Map<string, DebounceEntry>();
  private defaultDelay = 300; // 300ms debounce

  /**
   * Set an item in localStorage with debouncing
   * @param key - Storage key
   * @param value - Value to store (will be JSON.stringified)
   * @param delay - Debounce delay in ms (default: 300ms)
   */
  setItem(key: string, value: unknown, delay: number = this.defaultDelay): void {
    // Clear existing timer if any
    const existing = this.pendingWrites.get(key);
    if (existing) {
      clearTimeout(existing.timer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        this.pendingWrites.delete(key);
      } catch (error) {
        console.warn('Failed to save to localStorage:', key, error);
        this.pendingWrites.delete(key);
      }
    }, delay);

    // Store the timer and data
    this.pendingWrites.set(key, { timer, data: value });
  }

  /**
   * Immediately flush a pending write to localStorage
   * @param key - Storage key to flush
   */
  flush(key: string): void {
    const entry = this.pendingWrites.get(key);
    if (entry) {
      clearTimeout(entry.timer);
      try {
        localStorage.setItem(key, JSON.stringify(entry.data));
      } catch (error) {
        console.warn('Failed to flush to localStorage:', key, error);
      }
      this.pendingWrites.delete(key);
    }
  }

  /**
   * Flush all pending writes immediately
   */
  flushAll(): void {
    for (const [key] of this.pendingWrites) {
      this.flush(key);
    }
  }

  /**
   * Cancel a pending write
   * @param key - Storage key to cancel
   */
  cancel(key: string): void {
    const entry = this.pendingWrites.get(key);
    if (entry) {
      clearTimeout(entry.timer);
      this.pendingWrites.delete(key);
    }
  }

  /**
   * Get item from localStorage (synchronous)
   * @param key - Storage key
   * @returns Parsed item or null
   */
  getItem(key: string): unknown {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to get from localStorage:', key, error);
      return null;
    }
  }

  /**
   * Remove item from localStorage and cancel any pending writes
   * @param key - Storage key to remove
   */
  removeItem(key: string): void {
    this.cancel(key);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', key, error);
    }
  }

  /**
   * Check if there are pending writes for a key
   * @param key - Storage key
   * @returns True if there are pending writes
   */
  hasPendingWrites(key: string): boolean {
    return this.pendingWrites.has(key);
  }
}

// Export singleton instance
export const debouncedStorage = new DebouncedStorage();