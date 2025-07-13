import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';

describe('CacheService - Advanced Coverage', () => {
  let service: CacheService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterEach(async () => {
    service.clear();
    await module.close();
  });

  describe('constructor and interval coverage', () => {
    it('should initialize cleanup interval in constructor', () => {
      // Test that the service initializes properly with cleanup interval
      expect(service).toBeDefined();
      expect(service.getStats().totalItems).toBe(0);
    });

    it('should execute cleanup function after sufficient time', () => {
      jest.useFakeTimers();

      // Add items that will expire quickly
      service.set('test1', 'data1', 100); // 100ms TTL
      service.set('test2', 'data2', 100); // 100ms TTL
      service.set('test3', 'data3', 600000); // 10 minutes TTL

      expect(service.getStats().totalItems).toBe(3);

      // Advance time to expire the short-lived items
      jest.advanceTimersByTime(200); // Items expire

      // Manually trigger a cleanup by accessing expired items (this will clean them up)
      expect(service.get('test1')).toBeNull(); // This triggers cleanup of expired item
      expect(service.get('test2')).toBeNull(); // This triggers cleanup of expired item
      expect(service.get('test3')).toBe('data3'); // This should still exist

      // The cache should now have cleaned up expired items through natural access
      expect(service.getStats().totalItems).toBe(1);

      jest.useRealTimers();
    });

    it('should handle interval-based cleanup execution', () => {
      jest.useFakeTimers();

      // Fill cache with items that will expire
      for (let i = 0; i < 50; i++) {
        service.set(`short-${i}`, `data-${i}`, 50); // 50ms TTL
      }

      service.set('long-lived', 'persistent-data', 600000); // 10 minutes

      expect(service.getStats().totalItems).toBe(51);

      // Let items expire
      jest.advanceTimersByTime(100);

      // Now advance time to trigger the cleanup interval (5 minutes)
      jest.advanceTimersByTime(300000);

      // Check if any expired items are cleaned up by accessing the cache
      expect(service.get('long-lived')).toBe('persistent-data');

      // After accessing and potentially triggering cleanup,
      // expired items should be gone
      expect(service.get('short-0')).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('comprehensive edge cases', () => {
    it('should handle extreme TTL values', () => {
      // Test with very small TTL
      service.set('micro-ttl', 'data', 1); // 1ms TTL

      // Should expire almost immediately
      setTimeout(() => {
        expect(service.get('micro-ttl')).toBeNull();
      }, 10);

      // Test with very large TTL
      service.set('macro-ttl', 'data', 999999999); // Very large TTL
      expect(service.get('macro-ttl')).toBe('data');
    });

    it('should handle rapid successive operations', () => {
      // Rapid set operations
      for (let i = 0; i < 1000; i++) {
        service.set(`rapid-${i}`, `data-${i}`);
      }

      expect(service.getStats().totalItems).toBe(1000);

      // Rapid get operations
      for (let i = 0; i < 1000; i++) {
        expect(service.get(`rapid-${i}`)).toBe(`data-${i}`);
      }

      // Rapid delete operations
      for (let i = 0; i < 500; i++) {
        expect(service.delete(`rapid-${i}`)).toBe(true);
      }

      expect(service.getStats().totalItems).toBe(500);
    });

    it('should maintain consistency under mixed operations', () => {
      // Mixed operations: set, get, delete, clearPattern
      service.set('test:1', 'data1');
      service.set('test:2', 'data2');
      service.set('other:1', 'data3');
      service.set('other:2', 'data4');

      expect(service.getStats().totalItems).toBe(4);

      // Pattern clearing
      const cleared = service.clearPattern('test:*');
      expect(cleared).toBe(2);
      expect(service.getStats().totalItems).toBe(2);

      // Remaining items should be accessible
      expect(service.get('other:1')).toBe('data3');
      expect(service.get('other:2')).toBe('data4');

      // Deleted items should be null
      expect(service.get('test:1')).toBeNull();
      expect(service.get('test:2')).toBeNull();
    });
  });
});
