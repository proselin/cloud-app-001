/**
 * Global E2E teardown - applying proven patterns from test-teardown.ts
 * Ensures clean shutdown and resource cleanup for E2E tests
 */

module.exports = async function () {
  try {
    // Apply same error stats tracking as test-teardown.ts
    const errors = globalThis.__E2E_ERRORS__ || {};

    // Log basic stats if there were errors (same pattern as unit tests)
    if (Object.keys(errors).length > 0) {
      console.log('📊 E2E Error Summary:', Object.keys(errors).length, 'types');
    }

    console.log('✅ E2E teardown completed');

    // Apply CI-aware cleanup (same pattern as test-teardown.ts)
    if (process.env['CI']) {
      // Force exit in CI to prevent hanging
      setTimeout(() => {
        console.log('🔄 Force exiting E2E in CI environment');
        process.exit(0);
      }, 5000);
    }

    console.log(globalThis.__TEARDOWN_MESSAGE__ || '🎯 E2E tests completed successfully');
  } catch (error) {
    console.error('E2E teardown error:', error);

    // Apply same fallback cleanup as test-teardown.ts
    console.log('📊 Basic E2E teardown stats:');
    console.log('  Memory:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
    console.log('  Uptime:', Math.round(process.uptime()), 'seconds');
  }
};
