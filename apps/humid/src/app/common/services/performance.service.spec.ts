import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceService, PerformanceMetric } from './performance.service';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [PerformanceService],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
  });

  afterEach(async () => {
    service.clearMetrics();
    await module.close();
  });

  describe('recordMetric() method', () => {
    it('should record performance metrics correctly', () => {
      const metric: PerformanceMetric = {
        method: 'GET',
        endpoint: '/api/comics',
        duration: 150,
        timestamp: Date.now(),
        statusCode: 200,
      };

      service.recordMetric(metric);
      const stats = service.getStats();

      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBe(150);
    });

    it('should handle metrics without status code', () => {
      const metric: PerformanceMetric = {
        method: 'POST',
        endpoint: '/api/chapters',
        duration: 75,
        timestamp: Date.now(),
      };

      service.recordMetric(metric);
      const stats = service.getStats();

      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBe(75);
    });

    it('should handle metrics with errors', () => {
      const metric: PerformanceMetric = {
        method: 'GET',
        endpoint: '/api/error',
        duration: 200,
        timestamp: Date.now(),
        statusCode: 500,
        error: 'Internal Server Error',
      };

      service.recordMetric(metric);
      const stats = service.getStats();

      expect(stats.totalRequests).toBe(1);
      expect(stats.errorRate).toBe(100);
    });

    it('should log warning for slow requests', () => {
      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      const slowMetric: PerformanceMetric = {
        method: 'GET',
        endpoint: '/api/slow-endpoint',
        duration: 6000, // 6 seconds (over 5 second threshold)
        timestamp: Date.now(),
        statusCode: 200,
      };

      service.recordMetric(slowMetric);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Slow request detected: GET /api/slow-endpoint took 6000ms'
      );

      loggerSpy.mockRestore();
    });

    it('should not log warning for fast requests', () => {
      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      const fastMetric: PerformanceMetric = {
        method: 'GET',
        endpoint: '/api/fast-endpoint',
        duration: 100,
        timestamp: Date.now(),
        statusCode: 200,
      };

      service.recordMetric(fastMetric);

      expect(loggerSpy).not.toHaveBeenCalled();
      loggerSpy.mockRestore();
    });

    it('should enforce maximum metrics limit', () => {
      // Add metrics beyond the limit (10,000)
      for (let i = 0; i < 10005; i++) {
        const metric: PerformanceMetric = {
          method: 'GET',
          endpoint: `/api/test/${i}`,
          duration: 100,
          timestamp: Date.now(),
          statusCode: 200,
        };
        service.recordMetric(metric);
      }

      const stats = service.getStats();
      expect(stats.totalRequests).toBe(10000); // Should be capped at MAX_METRICS
    });
  });

  describe('getStats() method', () => {
    beforeEach(() => {
      // Clear any existing metrics
      service.clearMetrics();
    });

    it('should return zero stats when no metrics exist', () => {
      const stats = service.getStats();

      expect(stats.averageResponseTime).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.errorRate).toBe(0);
      expect(stats.slowestEndpoints).toEqual([]);
      expect(stats.requestsPerMinute).toBe(0);
    });

    it('should calculate average response time correctly', () => {
      const metrics: PerformanceMetric[] = [
        { method: 'GET', endpoint: '/api/test1', duration: 100, timestamp: Date.now() },
        { method: 'GET', endpoint: '/api/test2', duration: 200, timestamp: Date.now() },
        { method: 'GET', endpoint: '/api/test3', duration: 300, timestamp: Date.now() },
      ];

      metrics.forEach(metric => service.recordMetric(metric));
      const stats = service.getStats();

      expect(stats.averageResponseTime).toBe(200); // (100 + 200 + 300) / 3 = 200
      expect(stats.totalRequests).toBe(3);
    });

    it('should calculate error rate correctly', () => {
      const metrics: PerformanceMetric[] = [
        { method: 'GET', endpoint: '/api/success1', duration: 100, timestamp: Date.now(), statusCode: 200 },
        { method: 'GET', endpoint: '/api/success2', duration: 150, timestamp: Date.now(), statusCode: 200 },
        { method: 'GET', endpoint: '/api/error1', duration: 200, timestamp: Date.now(), statusCode: 404 },
        { method: 'GET', endpoint: '/api/error2', duration: 250, timestamp: Date.now(), statusCode: 500 },
      ];

      metrics.forEach(metric => service.recordMetric(metric));
      const stats = service.getStats();

      expect(stats.errorRate).toBe(50); // 2 errors out of 4 requests = 50%
      expect(stats.totalRequests).toBe(4);
    });

    it('should identify slowest endpoints correctly', () => {
      const metrics: PerformanceMetric[] = [
        { method: 'GET', endpoint: '/api/fast', duration: 50, timestamp: Date.now() },
        { method: 'GET', endpoint: '/api/fast', duration: 100, timestamp: Date.now() },
        { method: 'GET', endpoint: '/api/medium', duration: 200, timestamp: Date.now() },
        { method: 'GET', endpoint: '/api/medium', duration: 300, timestamp: Date.now() },
        { method: 'GET', endpoint: '/api/slow', duration: 800, timestamp: Date.now() },
        { method: 'GET', endpoint: '/api/slow', duration: 1000, timestamp: Date.now() },
      ];

      metrics.forEach(metric => service.recordMetric(metric));
      const stats = service.getStats();

      expect(stats.slowestEndpoints).toHaveLength(3);
      expect(stats.slowestEndpoints[0].endpoint).toBe('GET /api/slow');
      expect(stats.slowestEndpoints[0].avgDuration).toBe(900); // (800 + 1000) / 2
      expect(stats.slowestEndpoints[1].endpoint).toBe('GET /api/medium');
      expect(stats.slowestEndpoints[1].avgDuration).toBe(250); // (200 + 300) / 2
    });

    it('should limit slowest endpoints to top 5', () => {
      // Create 10 different endpoints
      for (let i = 1; i <= 10; i++) {
        const metric: PerformanceMetric = {
          method: 'GET',
          endpoint: `/api/endpoint${i}`,
          duration: i * 100, // Increasing duration
          timestamp: Date.now(),
        };
        service.recordMetric(metric);
      }

      const stats = service.getStats();
      expect(stats.slowestEndpoints).toHaveLength(5);
      expect(stats.slowestEndpoints[0].endpoint).toBe('GET /api/endpoint10');
    });

    it('should calculate requests per minute correctly', () => {
      const now = Date.now();
      const metrics: PerformanceMetric[] = [
        { method: 'GET', endpoint: '/api/test1', duration: 100, timestamp: now },
        { method: 'GET', endpoint: '/api/test2', duration: 100, timestamp: now },
        { method: 'GET', endpoint: '/api/test3', duration: 100, timestamp: now },
      ];

      metrics.forEach(metric => service.recordMetric(metric));
      const stats = service.getStats(1); // 1 minute window

      expect(stats.requestsPerMinute).toBe(3); // 3 requests in 1 minute
    });

    it('should respect time window parameter', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000); // 1 hour ago
      const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutes ago

      const metrics: PerformanceMetric[] = [
        { method: 'GET', endpoint: '/api/old', duration: 100, timestamp: oneHourAgo },
        { method: 'GET', endpoint: '/api/recent', duration: 200, timestamp: fiveMinutesAgo },
        { method: 'GET', endpoint: '/api/current', duration: 300, timestamp: now },
      ];

      metrics.forEach(metric => service.recordMetric(metric));

      // 10-minute window should include recent and current
      const stats10min = service.getStats(10);
      expect(stats10min.totalRequests).toBe(2);
      expect(stats10min.averageResponseTime).toBe(250); // (200 + 300) / 2

      // 1-minute window should include only current
      const stats1min = service.getStats(1);
      expect(stats1min.totalRequests).toBe(1);
      expect(stats1min.averageResponseTime).toBe(300);
    });

    it('should handle error detection with error property', () => {
      const metrics: PerformanceMetric[] = [
        { method: 'GET', endpoint: '/api/success', duration: 100, timestamp: Date.now(), statusCode: 200 },
        { method: 'GET', endpoint: '/api/error', duration: 200, timestamp: Date.now(), error: 'Network Error' },
      ];

      metrics.forEach(metric => service.recordMetric(metric));
      const stats = service.getStats();

      expect(stats.errorRate).toBe(50); // 1 error out of 2 requests
    });
  });

  describe('getHealthScore() method', () => {
    beforeEach(() => {
      service.clearMetrics();
    });

    it('should return 100 for perfect health (no requests)', () => {
      const score = service.getHealthScore();
      expect(score).toBe(100);
    });

    it('should return 100 for fast, successful requests', () => {
      const metrics: PerformanceMetric[] = [
        { method: 'GET', endpoint: '/api/fast1', duration: 50, timestamp: Date.now(), statusCode: 200 },
        { method: 'GET', endpoint: '/api/fast2', duration: 100, timestamp: Date.now(), statusCode: 200 },
        { method: 'GET', endpoint: '/api/fast3', duration: 75, timestamp: Date.now(), statusCode: 200 },
      ];

      metrics.forEach(metric => service.recordMetric(metric));
      const score = service.getHealthScore();

      expect(score).toBe(100);
    });

    it('should penalize high error rates', () => {
      const metrics: PerformanceMetric[] = [
        { method: 'GET', endpoint: '/api/success', duration: 100, timestamp: Date.now(), statusCode: 200 },
        { method: 'GET', endpoint: '/api/error1', duration: 100, timestamp: Date.now(), statusCode: 500 },
        { method: 'GET', endpoint: '/api/error2', duration: 100, timestamp: Date.now(), statusCode: 404 },
        { method: 'GET', endpoint: '/api/error3', duration: 100, timestamp: Date.now(), statusCode: 400 },
      ];

      metrics.forEach(metric => service.recordMetric(metric));
      const score = service.getHealthScore();

      // 75% error rate should reduce score by 75 * 2 = 150, but minimum is 0
      expect(score).toBe(0);
    });

    it('should penalize slow response times', () => {
      const metrics: PerformanceMetric[] = [
        { method: 'GET', endpoint: '/api/slow', duration: 3000, timestamp: Date.now(), statusCode: 200 },
      ];

      metrics.forEach(metric => service.recordMetric(metric));
      const score = service.getHealthScore();

      // 3000ms response time: (3000 - 1000) / 100 = 20 point penalty
      expect(score).toBe(80);
    });

    it('should handle very slow requests with maximum penalty', () => {
      const metrics: PerformanceMetric[] = [
        { method: 'GET', endpoint: '/api/veryslow', duration: 10000, timestamp: Date.now(), statusCode: 200 },
      ];

      metrics.forEach(metric => service.recordMetric(metric));
      const score = service.getHealthScore();

      // 10000ms response time would be (10000 - 1000) / 100 = 90 penalty, but max is 50
      expect(score).toBe(50);
    });

    it('should combine error rate and response time penalties', () => {
      const metrics: PerformanceMetric[] = [
        { method: 'GET', endpoint: '/api/slowsuccess', duration: 2000, timestamp: Date.now(), statusCode: 200 },
        { method: 'GET', endpoint: '/api/slowerror', duration: 2000, timestamp: Date.now(), statusCode: 500 },
      ];

      metrics.forEach(metric => service.recordMetric(metric));
      const score = service.getHealthScore();

      // 50% error rate = 100 penalty
      // 2000ms avg response = (2000 - 1000) / 100 = 10 penalty
      // Total penalty = 110, score = 100 - 110 = 0 (minimum)
      expect(score).toBe(0);
    });

    it('should ensure minimum score of 0', () => {
      const metrics: PerformanceMetric[] = [];

      // Create metrics with very high error rate and slow response
      for (let i = 0; i < 10; i++) {
        metrics.push({
          method: 'GET',
          endpoint: `/api/terrible${i}`,
          duration: 15000, // Very slow
          timestamp: Date.now(),
          statusCode: 500, // Error
        });
      }

      metrics.forEach(metric => service.recordMetric(metric));
      const score = service.getHealthScore();

      expect(score).toBe(0); // Should not go below 0
    });
  });

  describe('clearMetrics() method', () => {
    it('should clear all metrics and log debug message', () => {
      const loggerSpy = jest.spyOn(service['logger'], 'debug');

      // Add some metrics first
      const metrics: PerformanceMetric[] = [
        { method: 'GET', endpoint: '/api/test1', duration: 100, timestamp: Date.now() },
        { method: 'GET', endpoint: '/api/test2', duration: 200, timestamp: Date.now() },
      ];

      metrics.forEach(metric => service.recordMetric(metric));
      expect(service.getStats().totalRequests).toBe(2);

      service.clearMetrics();

      expect(service.getStats().totalRequests).toBe(0);
      expect(loggerSpy).toHaveBeenCalledWith('Performance metrics cleared');

      loggerSpy.mockRestore();
    });

    it('should handle clearing empty metrics', () => {
      expect(service.getStats().totalRequests).toBe(0);

      expect(() => service.clearMetrics()).not.toThrow();
      expect(service.getStats().totalRequests).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle metrics with zero duration', () => {
      const metric: PerformanceMetric = {
        method: 'GET',
        endpoint: '/api/instant',
        duration: 0,
        timestamp: Date.now(),
        statusCode: 200,
      };

      service.recordMetric(metric);
      const stats = service.getStats();

      expect(stats.averageResponseTime).toBe(0);
      expect(stats.totalRequests).toBe(1);
    });

    it('should handle metrics with negative duration', () => {
      const metric: PerformanceMetric = {
        method: 'GET',
        endpoint: '/api/negative',
        duration: -100,
        timestamp: Date.now(),
        statusCode: 200,
      };

      service.recordMetric(metric);
      const stats = service.getStats();

      expect(stats.averageResponseTime).toBe(-100);
      expect(stats.totalRequests).toBe(1);
    });

    it('should handle future timestamps', () => {
      const futureTime = Date.now() + 86400000; // 1 day in future
      const metric: PerformanceMetric = {
        method: 'GET',
        endpoint: '/api/future',
        duration: 100,
        timestamp: futureTime,
        statusCode: 200,
      };

      service.recordMetric(metric);
      const stats = service.getStats();

      expect(stats.totalRequests).toBe(1);
    });

    it('should handle very large durations', () => {
      const metric: PerformanceMetric = {
        method: 'GET',
        endpoint: '/api/extremely-slow',
        duration: 999999999, // Very large number
        timestamp: Date.now(),
        statusCode: 200,
      };

      service.recordMetric(metric);
      const stats = service.getStats();

      expect(stats.averageResponseTime).toBe(999999999);
      expect(stats.totalRequests).toBe(1);
    });

    it('should handle empty endpoint names', () => {
      const metric: PerformanceMetric = {
        method: 'GET',
        endpoint: '',
        duration: 100,
        timestamp: Date.now(),
        statusCode: 200,
      };

      service.recordMetric(metric);
      const stats = service.getStats();

      expect(stats.totalRequests).toBe(1);
      expect(stats.slowestEndpoints[0].endpoint).toBe('GET ');
    });

    it('should handle special characters in endpoints', () => {
      const metric: PerformanceMetric = {
        method: 'GET',
        endpoint: '/api/special-chars!@#$%^&*()',
        duration: 100,
        timestamp: Date.now(),
        statusCode: 200,
      };

      service.recordMetric(metric);
      const stats = service.getStats();

      expect(stats.totalRequests).toBe(1);
      expect(stats.slowestEndpoints[0].endpoint).toBe('GET /api/special-chars!@#$%^&*()');
    });
  });
});
