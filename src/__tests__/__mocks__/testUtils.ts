/**
 * Test utility functions for common testing patterns
 */

/**
 * Creates a mock localStorage for testing
 */
export function createMockLocalStorage() {
  const store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
  }
}

/**
 * Sets up localStorage mock for tests
 */
export function setupLocalStorageMock() {
  const mockStorage = createMockLocalStorage()
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  })
  return mockStorage
}

/**
 * Creates a mock Date that can be controlled in tests
 */
export function createMockDate(dateString: string) {
  const mockDate = new Date(dateString)
  const originalDate = global.Date

  beforeAll(() => {
    global.Date = class extends originalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          return mockDate
        }
        return new originalDate(...args)
      }
      static now() {
        return mockDate.getTime()
      }
    } as any
  })

  afterAll(() => {
    global.Date = originalDate
  })

  return mockDate
}

/**
 * Wait for a specific amount of time (for async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Flush all pending promises
 */
export async function flushPromises() {
  return new Promise(resolve => setImmediate(resolve))
}

/**
 * Creates a deferred promise for testing async operations
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void
  let reject: (error: any) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  }
}
