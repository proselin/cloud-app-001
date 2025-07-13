/**
 * Global teardown for Jest tests
 * Simple cleanup and stats reporting
 */

import { restoreTestEnvironment, getErrorStats } from './test-setup';

export default async (): Promise<void> => {
  try {
    // Restore console
    restoreTestEnvironment();

    // Get error stats
    const errors = getErrorStats();

    // Log basic stats if there were errors
    if (Object.keys(errors).length > 0) {
      console.log('📊 Test Error Summary:', Object.keys(errors).length, 'types');
    }

    console.log('✅ Test teardown completed');

    // Additional cleanup for CI environments
    if (process.env['CI']) {
      // Force exit in CI to prevent hanging
      setTimeout(() => {
        console.log('🔄 Force exiting in CI environment');
        process.exit(0);
      }, 5000);
    }
  } catch (error) {
    console.error('Test teardown error:', error);

    // Fallback basic cleanup
    console.log('📊 Basic teardown stats:');
    console.log('  Memory:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB');
    console.log('  Uptime:', Math.round(process.uptime()), 'seconds');
  }
};
