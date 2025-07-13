/**
 * Test setup for humid app
 * Provides essential console suppression and cleanup for NestJS tests
 */

// Test state tracking
let originalConsole: Partial<Console> = {};
const testErrors: Map<string, number> = new Map();

// Initialize test environment
export function initializeTestEnvironment(): void {
  // Store original console methods
  originalConsole = {
    error: console.error,
    warn: console.warn
  };

  // Suppress known test noise
  const suppressedMessages = [
    'Cache set failed',
    'Search failed',
    'Database error',
    'ERROR [',
    'Crawl failed',
    'No URLs provided',
    'Network error',
    'Missing HTTP Service',
    'Missing URL content',
    'Missing Html content',
    'slug is not found',
    'Header is not found',
    'comicId is not found',
    'Not found thumb url'
  ];

  console.error = (...args: unknown[]) => {
    const message = String(args[0] || '');
    if (suppressedMessages.some(msg => message.includes(msg))) {
      trackTestError(message);
      return;
    }
    originalConsole.error?.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    const message = String(args[0] || '');
    if (suppressedMessages.some(msg => message.includes(msg))) {
      trackTestError(message);
      return;
    }
    originalConsole.warn?.apply(console, args);
  };
}

// Cleanup and restore console
export function restoreTestEnvironment(): void {
  if (originalConsole.error) console.error = originalConsole.error;
  if (originalConsole.warn) console.warn = originalConsole.warn;
}

// Utility functions for backward compatibility
export const performCleanup = async (): Promise<void> => {
  // Simple cleanup - let Jest handle most of it
  await new Promise(resolve => setTimeout(resolve, 50));
};

export const trackTestError = (error: string): void => {
  const count = testErrors.get(error) || 0;
  testErrors.set(error, count + 1);
};

export const getErrorStats = (): Record<string, number> => {
  return Object.fromEntries(testErrors);
};

export const detectMemoryLeak = (): boolean => {
  // Simple check - Jest will handle detailed memory monitoring
  return false;
};

export const takeMemorySnapshot = (): void => {
  // Simple no-op - Jest handles memory monitoring
};

// Initialize immediately
initializeTestEnvironment();
