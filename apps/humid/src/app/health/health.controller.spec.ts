import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { CacheService } from '../common/services/cache.service';
import { PerformanceService } from '../common/services/performance.service';

describe('HealthController', () => {
  let controller: HealthController;
  let cacheService: CacheService;
  let performanceService: PerformanceService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [CacheService, PerformanceService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    cacheService = module.get<CacheService>(CacheService);
    performanceService = module.get<PerformanceService>(PerformanceService);
  });

  afterEach(async () => {
    // Clean up services
    cacheService.clear();
    performanceService.clearMetrics();
    await module.close();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have access to cache service', () => {
      expect(cacheService).toBeDefined();
    });

    it('should have access to performance service', () => {
      expect(performanceService).toBeDefined();
    });
  });

  describe('healthCheck() - Basic Health Endpoint', () => {
    it('should return basic health status', () => {
      const result = controller.healthCheck();

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return valid ISO timestamp', () => {
      const result = controller.healthCheck();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return current uptime from process', () => {
      const beforeUptime = process.uptime();
      const result = controller.healthCheck();
      const afterUptime = process.uptime();

      expect(result.uptime).toBeGreaterThanOrEqual(beforeUptime);
      expect(result.uptime).toBeLessThanOrEqual(afterUptime);
    });

    it('should return consistent structure on multiple calls', () => {
      const result1 = controller.healthCheck();
      const result2 = controller.healthCheck();

      expect(result1).toHaveProperty('status');
      expect(result1).toHaveProperty('timestamp');
      expect(result1).toHaveProperty('uptime');

      expect(result2).toHaveProperty('status');
      expect(result2).toHaveProperty('timestamp');
      expect(result2).toHaveProperty('uptime');

      // Status should always be 'ok'
      expect(result1.status).toBe('ok');
      expect(result2.status).toBe('ok');
    });
  });

  describe('detailedHealthCheck() - Detailed Health Endpoint', () => {
    it('should return detailed health information', () => {
      const result = controller.detailedHealthCheck();

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.memory).toBeDefined();
      expect(result.cache).toBeDefined();
      expect(result.performance).toBeDefined();
    });

    it('should include proper memory information', () => {
      const result = controller.detailedHealthCheck();

      expect(result.memory).toHaveProperty('used');
      expect(result.memory).toHaveProperty('free');
      expect(result.memory).toHaveProperty('total');

      expect(typeof result.memory.used).toBe('number');
      expect(typeof result.memory.free).toBe('number');
      expect(typeof result.memory.total).toBe('number');

      expect(result.memory.used).toBeGreaterThanOrEqual(0);
      expect(result.memory.free).toBeGreaterThanOrEqual(0);
      expect(result.memory.total).toBeGreaterThan(0);

      // Total should equal used + free (approximately)
      expect(Math.abs(result.memory.total - (result.memory.used + result.memory.free))).toBeLessThan(0.1);
    });

    it('should include cache statistics', () => {
      // Add some cache data
      cacheService.set('test-key-1', 'test-data-1');
      cacheService.set('test-key-2', 'test-data-2');
      cacheService.get('test-key-1'); // Generate a hit

      const result = controller.detailedHealthCheck();

      expect(result.cache).toHaveProperty('totalItems');
      expect(result.cache).toHaveProperty('totalHits');
      expect(result.cache).toHaveProperty('totalMisses');
      expect(result.cache).toHaveProperty('hitRate');
      expect(result.cache).toHaveProperty('memoryUsage');

      expect(result.cache.totalItems).toBe(2);
      expect(result.cache.totalHits).toBe(1);
    });

    it('should include performance statistics with health score', () => {
      // Add some performance metrics
      performanceService.recordMetric({
        method: 'GET',
        endpoint: '/api/test',
        duration: 150,
        timestamp: Date.now(),
        statusCode: 200,
      });

      const result = controller.detailedHealthCheck();

      expect(result.performance).toHaveProperty('averageResponseTime');
      expect(result.performance).toHaveProperty('totalRequests');
      expect(result.performance).toHaveProperty('errorRate');
      expect(result.performance).toHaveProperty('slowestEndpoints');
      expect(result.performance).toHaveProperty('requestsPerMinute');
      expect(result.performance).toHaveProperty('healthScore');

      expect(result.performance.totalRequests).toBe(1);
      expect(result.performance.averageResponseTime).toBe(150);
      expect(result.performance.healthScore).toBe(100);
    });

    it('should handle empty cache and performance data', () => {
      const result = controller.detailedHealthCheck();

      expect(result.cache.totalItems).toBe(0);
      expect(result.cache.totalHits).toBe(0);
      expect(result.cache.totalMisses).toBe(0);
      expect(result.cache.hitRate).toBe(0);

      expect(result.performance.totalRequests).toBe(0);
      expect(result.performance.averageResponseTime).toBe(0);
      expect(result.performance.healthScore).toBe(100);
    });

    it('should calculate memory usage in MB with proper rounding', () => {
      const result = controller.detailedHealthCheck();
      const memoryUsage = process.memoryUsage();

      const expectedUsed = Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;
      const expectedFree = Math.round(((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024) * 100) / 100;
      const expectedTotal = Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100;

      expect(result.memory.used).toBe(expectedUsed);
      expect(result.memory.free).toBe(expectedFree);
      expect(result.memory.total).toBe(expectedTotal);
    });
  });

  describe('getCacheStats() - Cache Statistics Endpoint', () => {
    it('should return cache statistics', () => {
      const result = controller.getCacheStats();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalItems');
      expect(result).toHaveProperty('totalHits');
      expect(result).toHaveProperty('totalMisses');
      expect(result).toHaveProperty('hitRate');
      expect(result).toHaveProperty('memoryUsage');
    });

    it('should return current cache state', () => {
      // Initially empty
      let result = controller.getCacheStats();
      expect(result.totalItems).toBe(0);

      // Add cache items
      cacheService.set('cache-test-1', 'data1');
      cacheService.set('cache-test-2', 'data2');
      cacheService.set('cache-test-3', 'data3');

      result = controller.getCacheStats();
      expect(result.totalItems).toBe(3);

      // Generate some hits and misses
      cacheService.get('cache-test-1'); // hit
      cacheService.get('cache-test-2'); // hit
      cacheService.get('nonexistent'); // miss

      result = controller.getCacheStats();
      expect(result.totalHits).toBe(2);
      expect(result.totalMisses).toBe(1);
      expect(result.hitRate).toBe(66.67); // 2/(2+1) * 100 = 66.67%
    });

    it('should reflect cache operations in real-time', () => {
      // Add an item
      cacheService.set('realtime-test', 'data');
      let result = controller.getCacheStats();
      expect(result.totalItems).toBe(1);

      // Delete the item
      cacheService.delete('realtime-test');
      result = controller.getCacheStats();
      expect(result.totalItems).toBe(0);

      // Clear cache
      cacheService.set('test1', 'data1');
      cacheService.set('test2', 'data2');
      result = controller.getCacheStats();
      expect(result.totalItems).toBe(2);

      cacheService.clear();
      result = controller.getCacheStats();
      expect(result.totalItems).toBe(0);
    });
  });

  describe('getPerformanceStats() - Performance Statistics Endpoint', () => {
    it('should return performance statistics with health score', () => {
      const result = controller.getPerformanceStats();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('averageResponseTime');
      expect(result).toHaveProperty('totalRequests');
      expect(result).toHaveProperty('errorRate');
      expect(result).toHaveProperty('slowestEndpoints');
      expect(result).toHaveProperty('requestsPerMinute');
      expect(result).toHaveProperty('healthScore');
    });

    it('should return current performance state', () => {
      // Initially empty
      let result = controller.getPerformanceStats();
      expect(result.totalRequests).toBe(0);
      expect(result.healthScore).toBe(100);

      // Add performance metrics
      performanceService.recordMetric({
        method: 'GET',
        endpoint: '/api/comics',
        duration: 120,
        timestamp: Date.now(),
        statusCode: 200,
      });

      performanceService.recordMetric({
        method: 'POST',
        endpoint: '/api/chapters',
        duration: 200,
        timestamp: Date.now(),
        statusCode: 201,
      });

      result = controller.getPerformanceStats();
      expect(result.totalRequests).toBe(2);
      expect(result.averageResponseTime).toBe(160); // (120 + 200) / 2
      expect(result.errorRate).toBe(0);
      expect(result.healthScore).toBe(100);
    });

    it('should include health score calculation', () => {
      // Add a slow request to affect health score
      performanceService.recordMetric({
        method: 'GET',
        endpoint: '/api/slow',
        duration: 3000, // 3 seconds
        timestamp: Date.now(),
        statusCode: 200,
      });

      const result = controller.getPerformanceStats();
      expect(result.healthScore).toBeLessThan(100); // Should be penalized for slow response
    });

    it('should handle error metrics properly', () => {
      // Add successful and error requests
      performanceService.recordMetric({
        method: 'GET',
        endpoint: '/api/success',
        duration: 100,
        timestamp: Date.now(),
        statusCode: 200,
      });

      performanceService.recordMetric({
        method: 'GET',
        endpoint: '/api/error',
        duration: 150,
        timestamp: Date.now(),
        statusCode: 500,
      });

      const result = controller.getPerformanceStats();
      expect(result.totalRequests).toBe(2);
      expect(result.errorRate).toBe(50); // 1 error out of 2 requests
      expect(result.healthScore).toBeLessThan(100); // Should be penalized for errors
    });

    it('should return slowest endpoints information', () => {
      // Add metrics for different endpoints
      performanceService.recordMetric({
        method: 'GET',
        endpoint: '/api/fast',
        duration: 50,
        timestamp: Date.now(),
        statusCode: 200,
      });

      performanceService.recordMetric({
        method: 'GET',
        endpoint: '/api/slow',
        duration: 500,
        timestamp: Date.now(),
        statusCode: 200,
      });

      const result = controller.getPerformanceStats();
      expect(result.slowestEndpoints).toHaveLength(2);
      expect(result.slowestEndpoints[0].endpoint).toBe('GET /api/slow');
      expect(result.slowestEndpoints[0].avgDuration).toBe(500);
      expect(result.slowestEndpoints[1].endpoint).toBe('GET /api/fast');
      expect(result.slowestEndpoints[1].avgDuration).toBe(50);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain consistency between detailed health and individual endpoints', () => {
      // Set up some data
      cacheService.set('integration-test', 'data');
      cacheService.get('integration-test'); // Generate hit

      performanceService.recordMetric({
        method: 'GET',
        endpoint: '/api/integration',
        duration: 150,
        timestamp: Date.now(),
        statusCode: 200,
      });

      // Get data from different endpoints
      const detailedHealth = controller.detailedHealthCheck();
      const cacheStats = controller.getCacheStats();
      const performanceStats = controller.getPerformanceStats();

      // Verify consistency
      expect(detailedHealth.cache).toEqual(cacheStats);

      // Performance stats should match except healthScore is separate in detailed health
      expect(detailedHealth.performance.averageResponseTime).toBe(performanceStats.averageResponseTime);
      expect(detailedHealth.performance.totalRequests).toBe(performanceStats.totalRequests);
      expect(detailedHealth.performance.errorRate).toBe(performanceStats.errorRate);
      expect(detailedHealth.performance.healthScore).toBe(performanceStats.healthScore);
    });

    it('should handle concurrent access to health endpoints', () => {
      // Add some data
      cacheService.set('concurrent-test', 'data');
      performanceService.recordMetric({
        method: 'GET',
        endpoint: '/api/concurrent',
        duration: 100,
        timestamp: Date.now(),
        statusCode: 200,
      });

      // Call multiple endpoints simultaneously
      const basicHealth = controller.healthCheck();
      const detailedHealth = controller.detailedHealthCheck();
      const cacheStats = controller.getCacheStats();
      const performanceStats = controller.getPerformanceStats();

      // All should return valid data
      expect(basicHealth.status).toBe('ok');
      expect(detailedHealth.status).toBe('ok');
      expect(cacheStats.totalItems).toBe(1);
      expect(performanceStats.totalRequests).toBe(1);
    });

    it('should work correctly with empty services', () => {
      // Ensure services are empty
      cacheService.clear();
      performanceService.clearMetrics();

      const basicHealth = controller.healthCheck();
      const detailedHealth = controller.detailedHealthCheck();
      const cacheStats = controller.getCacheStats();
      const performanceStats = controller.getPerformanceStats();

      expect(basicHealth.status).toBe('ok');
      expect(detailedHealth.status).toBe('ok');
      expect(cacheStats.totalItems).toBe(0);
      expect(performanceStats.totalRequests).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle memory calculation edge cases', () => {
      const result = controller.detailedHealthCheck();

      // Memory values should be reasonable
      expect(result.memory.used).toBeGreaterThan(0);
      expect(result.memory.total).toBeGreaterThan(result.memory.used);
      expect(result.memory.free).toBeGreaterThanOrEqual(0);
    });

    it('should handle timestamp formatting consistently', () => {
      const basicHealth = controller.healthCheck();
      const detailedHealth = controller.detailedHealthCheck();

      // Both should have valid ISO timestamps
      expect(new Date(basicHealth.timestamp)).toBeInstanceOf(Date);
      expect(new Date(detailedHealth.timestamp)).toBeInstanceOf(Date);

      // Timestamps should be very close (within 1 second)
      const timeDiff = Math.abs(
        new Date(detailedHealth.timestamp).getTime() -
        new Date(basicHealth.timestamp).getTime()
      );
      expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
    });

    it('should maintain uptime consistency', () => {
      const result1 = controller.healthCheck();

      // Wait a small amount of time
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      return delay(10).then(() => {
        const result2 = controller.healthCheck();

        // Second call should have slightly higher uptime
        expect(result2.uptime).toBeGreaterThanOrEqual(result1.uptime);
      });
    });
  });
});
