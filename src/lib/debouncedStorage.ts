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
  private isCleanupSetup = false;

  constructor() {
    this.setupCleanupHandlers();
  }

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

  /**
   * Cleanup all pending writes (prevents memory leaks)
   * Should be called when the application is being unloaded
   */
  cleanup(): void {
    console.log(`🧹 Cleaning up ${this.pendingWrites.size} pending writes`);
    
    this.pendingWrites.forEach((entry, key) => {
      try {
        clearTimeout(entry.timer);
      } catch (error) {
        console.warn('Failed to clear timer for key:', key, error);
      }
    });
    
    this.pendingWrites.clear();
  }

  /**
   * Setup cleanup handlers for page unload events
   * Prevents memory leaks and ensures data integrity
   */
  private setupCleanupHandlers(): void {
    if (this.isCleanupSetup || typeof window === 'undefined') {
      return;
    }

    this.isCleanupSetup = true;

    // Handle page unload - flush pending writes before cleanup
    const handleBeforeUnload = () => {
      try {
        // Flush all pending writes synchronously
        this.flushAll();
        console.log('🔄 Flushed all pending writes before unload');
      } catch (error) {
        console.warn('Failed to flush writes during beforeunload:', error);
      }
    };

    // Handle page hide (mobile browsers, tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        try {
          // Flush pending writes when page becomes hidden
          this.flushAll();
          console.log('🔄 Flushed pending writes on visibility hidden');
        } catch (error) {
          console.warn('Failed to flush writes during visibility change:', error);
        }
      }
    };

    // Handle complete cleanup on unload
    const handleUnload = () => {
      try {
        this.cleanup();
      } catch (error) {
        console.warn('Failed to cleanup during unload:', error);
      }
    };

    // Register event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also handle focus/blur for additional reliability
    window.addEventListener('blur', () => {
      try {
        this.flushAll();
        console.log('🔄 Flushed pending writes on window blur');
      } catch (error) {
        console.warn('Failed to flush writes on blur:', error);
      }
    });

    console.log('✅ DebouncedStorage cleanup handlers setup complete');
  }

  /**
   * Get debug information about pending writes
   */
  getDebugInfo(): { pendingCount: number; keys: string[] } {
    return {
      pendingCount: this.pendingWrites.size,
      keys: Array.from(this.pendingWrites.keys())
    };
  }
}

// Export singleton instance
export const debouncedStorage = new DebouncedStorage();