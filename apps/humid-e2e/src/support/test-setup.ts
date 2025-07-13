/**
 * E2E test setup - applying proven patterns from test-setup.ts
 * Configures axios and console suppression for clean E2E execution
 */
import axios from 'axios';

// Global error tracking (same pattern as unit tests)
globalThis.__E2E_ERRORS__ = {};
let originalConsole: Partial<Console> = {};

function trackE2EError(message: string): void {
  const errors = globalThis.__E2E_ERRORS__ || {};
  const errorType = message.split(':')[0] || 'unknown';
  errors[errorType] = (errors[errorType] || 0) + 1;
  globalThis.__E2E_ERRORS__ = errors;
}

module.exports = async function () {
  // Configure axios for tests
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '3000';
  axios.defaults.baseURL = `http://${host}:${port}`;

  // Apply console suppression patterns from test-setup.ts
  originalConsole = {
    error: console.error,
    warn: console.warn
  };

  // Suppress known E2E test noise (same approach as unit tests)
  const suppressedMessages = [
    'Cache set failed',
    'Search failed',
    'Database error',
    'ERROR [',
    'Network error',
    'ECONNREFUSED',
    'timeout',
    'Failed to load resource'
  ];

  console.error = (...args: unknown[]) => {
    const message = String(args[0] || '');
    if (suppressedMessages.some(msg => message.includes(msg))) {
      trackE2EError(message);
      return;
    }
    originalConsole.error?.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    const message = String(args[0] || '');
    if (suppressedMessages.some(msg => message.includes(msg))) {
      trackE2EError(message);
      return;
    }
    originalConsole.warn?.apply(console, args);
  };

  console.log('🚀 E2E test environment initialized with proven patterns');
};
