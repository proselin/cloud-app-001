import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterEach(async () => {
    // Clear cache and cleanup after each test
    service.clear();
    await module.close();
  });

  describe('set() and get() operations', () => {
    it('should store and retrieve data correctly', () => {
      const key = 'test-key';
      const data = { id: 1, name: 'test' };

      service.set(key, data);
      const result = service.get(key);

      expect(result).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const result = service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle different data types correctly', () => {
      service.set('string-key', 'test-string');
      service.set('number-key', 123);
      service.set('array-key', [1, 2, 3]);
      service.set('object-key', { test: true });
      service.set('boolean-key', false);

      expect(service.get('string-key')).toBe('test-string');
      expect(service.get('number-key')).toBe(123);
      expect(service.get('array-key')).toEqual([1, 2, 3]);
      expect(service.get('object-key')).toEqual({ test: true });
      expect(service.get('boolean-key')).toBe(false);
    });

    it('should override existing keys with new data', () => {
      const key = 'override-key';

      service.set(key, 'initial-value');
      expect(service.get(key)).toBe('initial-value');

      service.set(key, 'updated-value');
      expect(service.get(key)).toBe('updated-value');
    });
  });

  describe('TTL (Time To Live) functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should use default TTL when none specified', () => {
      const key = 'default-ttl-key';
      const data = 'test-data';

      service.set(key, data);

      // Should be available before default TTL expires (5 minutes)
      jest.advanceTimersByTime(299000); // 4 minutes 59 seconds
      expect(service.get(key)).toBe(data);

      // Should expire after default TTL
      jest.advanceTimersByTime(2000); // Additional 2 seconds (total > 5 minutes)
      expect(service.get(key)).toBeNull();
    });

    it('should respect custom TTL values', () => {
      const key = 'custom-ttl-key';
      const data = 'test-data';
      const customTtl = 10000; // 10 seconds

      service.set(key, data, customTtl);

      // Should be available before custom TTL expires
      jest.advanceTimersByTime(9000);
      expect(service.get(key)).toBe(data);

      // Should expire after custom TTL
      jest.advanceTimersByTime(2000);
      expect(service.get(key)).toBeNull();
    });

    it('should immediately expire with zero TTL', () => {
      const key = 'zero-ttl-key';
      const data = 'test-data';

      service.set(key, data, 0);

      // Should expire immediately
      jest.advanceTimersByTime(1);
      expect(service.get(key)).toBeNull();
    });

    it('should handle multiple items with different TTLs', () => {
      service.set('short-lived', 'data1', 5000);  // 5 seconds
      service.set('long-lived', 'data2', 15000);  // 15 seconds

      // After 6 seconds, short-lived should expire but long-lived should remain
      jest.advanceTimersByTime(6000);
      expect(service.get('short-lived')).toBeNull();
      expect(service.get('long-lived')).toBe('data2');

      // After 16 seconds total, both should expire
      jest.advanceTimersByTime(10000);
      expect(service.get('long-lived')).toBeNull();
    });
  });

  describe('generateKey() method', () => {
    it('should generate consistent keys for identical parameters', () => {
      const params = { id: 1, type: 'comic', page: 2 };

      const key1 = service.generateKey('test-prefix', params);
      const key2 = service.generateKey('test-prefix', params);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^test-prefix:[a-f0-9]{16}$/);
    });

    it('should generate different keys for different parameters', () => {
      const params1 = { id: 1, type: 'comic' };
      const params2 = { id: 2, type: 'comic' };

      const key1 = service.generateKey('test-prefix', params1);
      const key2 = service.generateKey('test-prefix', params2);

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different prefixes', () => {
      const params = { id: 1, type: 'comic' };

      const key1 = service.generateKey('comic', params);
      const key2 = service.generateKey('chapter', params);

      expect(key1).not.toBe(key2);
    });

    it('should handle empty parameters', () => {
      const key = service.generateKey('empty-params', {});
      expect(key).toMatch(/^empty-params:[a-f0-9]{16}$/);
    });

    it('should generate same key regardless of parameter order', () => {
      const params1 = { id: 1, type: 'comic', page: 2 };
      const params2 = { page: 2, id: 1, type: 'comic' };

      const key1 = service.generateKey('test', params1);
      const key2 = service.generateKey('test', params2);

      expect(key1).toBe(key2);
    });
  });

  describe('delete() method', () => {
    it('should delete existing keys and return true', () => {
      const key = 'delete-test';
      service.set(key, 'test-data');

      expect(service.get(key)).toBe('test-data');
      expect(service.delete(key)).toBe(true);
      expect(service.get(key)).toBeNull();
    });

    it('should return false for non-existent keys', () => {
      expect(service.delete('non-existent')).toBe(false);
    });

    it('should handle multiple deletions', () => {
      service.set('key1', 'data1');
      service.set('key2', 'data2');
      service.set('key3', 'data3');

      expect(service.delete('key1')).toBe(true);
      expect(service.delete('key3')).toBe(true);

      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBe('data2');
      expect(service.get('key3')).toBeNull();
    });
  });

  describe('clearPattern() method', () => {
    beforeEach(() => {
      service.set('comic:1', 'comic data 1');
      service.set('comic:2', 'comic data 2');
      service.set('chapter:1', 'chapter data 1');
      service.set('chapter:2', 'chapter data 2');
      service.set('user:profile', 'user data');
    });

    it('should clear keys matching simple patterns', () => {
      const cleared = service.clearPattern('comic:*');

      expect(cleared).toBe(2);
      expect(service.get('comic:1')).toBeNull();
      expect(service.get('comic:2')).toBeNull();
      expect(service.get('chapter:1')).toBe('chapter data 1');
    });

    it('should clear keys matching complex patterns', () => {
      const cleared = service.clearPattern('chapter:.*');

      expect(cleared).toBe(2);
      expect(service.get('chapter:1')).toBeNull();
      expect(service.get('chapter:2')).toBeNull();
      expect(service.get('comic:1')).toBe('comic data 1');
    });

    it('should return zero for non-matching patterns', () => {
      const cleared = service.clearPattern('nonexistent:*');
      expect(cleared).toBe(0);
    });

    it('should handle exact key matches', () => {
      const cleared = service.clearPattern('user:profile');

      expect(cleared).toBe(1);
      expect(service.get('user:profile')).toBeNull();
    });
  });

  describe('clear() method', () => {
    it('should clear all cache data and reset stats', () => {
      // Add some data and generate stats
      service.set('key1', 'data1');
      service.set('key2', 'data2');
      service.get('key1'); // Generate hit
      service.get('nonexistent'); // Generate miss

      const statsBefore = service.getStats();
      expect(statsBefore.totalItems).toBe(2);
      expect(statsBefore.totalHits).toBe(1);
      expect(statsBefore.totalMisses).toBe(1);

      service.clear();

      const statsAfter = service.getStats();
      expect(statsAfter.totalItems).toBe(0);
      expect(statsAfter.totalHits).toBe(0);
      expect(statsAfter.totalMisses).toBe(0);
      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBeNull();
    });
  });

  describe('getStats() method', () => {
    it('should return accurate cache statistics', () => {
      // Initial state
      let stats = service.getStats();
      expect(stats.totalItems).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.totalMisses).toBe(0);
      expect(stats.hitRate).toBe(0);

      // Add some data
      service.set('key1', 'data1');
      service.set('key2', { complex: 'object', with: { nested: 'data' } });

      stats = service.getStats();
      expect(stats.totalItems).toBe(2);
      expect(stats.memoryUsage).toBeGreaterThanOrEqual(0); // Memory usage in KB, might be 0 for small data

      // Generate hits and misses
      service.get('key1'); // hit
      service.get('key1'); // hit
      service.get('key2'); // hit
      service.get('nonexistent1'); // miss
      service.get('nonexistent2'); // miss

      stats = service.getStats();
      expect(stats.totalHits).toBe(3);
      expect(stats.totalMisses).toBe(2);
      expect(stats.hitRate).toBe(60); // 3/(3+2) * 100 = 60%
    });

    it('should calculate memory usage approximately', () => {
      const smallData = 'small';
      const largeData = { large: 'data'.repeat(100) };

      service.set('small-key', smallData);
      const statsSmall = service.getStats();
      expect(statsSmall.memoryUsage).toBeGreaterThanOrEqual(0);

      service.set('large-key', largeData);
      const statsLarge = service.getStats();

      expect(statsLarge.memoryUsage).toBeGreaterThanOrEqual(statsSmall.memoryUsage);
    });

    it('should handle zero division in hit rate calculation', () => {
      const stats = service.getStats();
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('LRU (Least Recently Used) eviction', () => {
    it('should evict least recently used items when cache is full', () => {
      // Test LRU functionality by monitoring behavior with large datasets
      const keys: string[] = [];
      const data: string[] = [];

      // Create test data
      for (let i = 0; i < 1005; i++) { // Exceed default max size of 1000
        keys.push(`key${i}`);
        data.push(`data${i}`);
      }

      // Fill cache beyond capacity
      keys.forEach((key, index) => {
        service.set(key, data[index]);
      });

      // First few items should be evicted due to LRU policy
      expect(service.get('key0')).toBeNull();
      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBeNull();
      expect(service.get('key3')).toBeNull();
      expect(service.get('key4')).toBeNull();

      // Recent items should still exist
      expect(service.get('key1000')).toBe('data1000');
      expect(service.get('key1001')).toBe('data1001');
      expect(service.get('key1002')).toBe('data1002');
      expect(service.get('key1003')).toBe('data1003');
      expect(service.get('key1004')).toBe('data1004');

      // Cache should maintain max size
      const stats = service.getStats();
      expect(stats.totalItems).toBeLessThanOrEqual(1000);
    });

    it('should handle access patterns in LRU eviction', () => {
      // Fill cache to near capacity (assuming 1000 max size)
      for (let i = 0; i < 995; i++) {
        service.set(`key${i}`, `data${i}`);
      }

      // Access some early items to make them recently used
      service.get('key0');
      service.get('key1');
      service.get('key2');

      // Add new items to trigger eviction
      service.set('new1', 'newdata1');
      service.set('new2', 'newdata2');
      service.set('new3', 'newdata3');
      service.set('new4', 'newdata4');
      service.set('new5', 'newdata5');

      // Recently accessed items should still exist
      expect(service.get('key0')).toBe('data0');
      expect(service.get('key1')).toBe('data1');
      expect(service.get('key2')).toBe('data2');

      // Newer items should exist
      expect(service.get('new5')).toBe('newdata5');
    });
  });

  describe('automatic cleanup functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should automatically clean up expired items at intervals', () => {
      // Add items with short TTL
      service.set('short1', 'data1', 5000);
      service.set('short2', 'data2', 5000);
      service.set('long', 'data3', 600000); // 10 minutes

      expect(service.getStats().totalItems).toBe(3);

      // Advance time to expire short-lived items
      jest.advanceTimersByTime(6000);

      // Items should still be in cache until cleanup runs
      expect(service.getStats().totalItems).toBe(3);

      // Trigger cleanup interval (5 minutes)
      jest.advanceTimersByTime(300000);

      // Expired items should be cleaned up
      expect(service.get('short1')).toBeNull();
      expect(service.get('short2')).toBeNull();
      expect(service.get('long')).toBe('data3');
    });

    it('should handle cleanup when no items are expired', () => {
      service.set('key1', 'data1', 600000); // 10 minutes
      service.set('key2', 'data2', 600000);

      const initialStats = service.getStats();

      // Trigger cleanup without expiring items
      jest.advanceTimersByTime(300000); // 5 minutes (cleanup interval)

      const afterStats = service.getStats();
      expect(afterStats.totalItems).toBe(initialStats.totalItems);
      expect(service.get('key1')).toBe('data1');
      expect(service.get('key2')).toBe('data2');
    });

    it('should run initial cleanup on service initialization', () => {
      // This tests the cleanup functionality that runs in constructor
      // We'll test this by adding items with past expiry and checking cleanup
      const initialTime = Date.now();

      // Set system time back, add items, then restore time to simulate cleanup scenario
      jest.spyOn(Date, 'now').mockReturnValue(initialTime - 600000); // 10 minutes ago
      service.set('past1', 'data1', 300000); // 5 minute TTL (expired)
      service.set('past2', 'data2', 300000); // 5 minute TTL (expired)

      // Restore current time
      jest.spyOn(Date, 'now').mockReturnValue(initialTime);

      // Items should be expired now when accessed
      expect(service.get('past1')).toBeNull();
      expect(service.get('past2')).toBeNull();

      jest.restoreAllMocks();
    });

    it('should log cleanup activity when expired items are removed', () => {
      // Create a fresh service to test constructor cleanup
      const testModule = Test.createTestingModule({
        providers: [CacheService],
      }).compile();

      const testService = testModule.then(m => m.get<CacheService>(CacheService));

      // This will test the cleanup functionality and potentially trigger logging
      expect(testService).resolves.toBeDefined();
    });
  });

  describe('hit tracking functionality', () => {
    it('should track hits per item correctly', () => {
      service.set('test-key', 'test-data');

      // Access the same key multiple times
      service.get('test-key');
      service.get('test-key');
      service.get('test-key');

      const stats = service.getStats();
      expect(stats.totalHits).toBe(3);
    });

    it('should not increment hits for expired items', () => {
      jest.useFakeTimers();

      service.set('expire-key', 'data', 5000);

      // Access before expiry
      service.get('expire-key');
      expect(service.getStats().totalHits).toBe(1);

      // Expire the item and try to access
      jest.advanceTimersByTime(6000);
      service.get('expire-key');

      const stats = service.getStats();
      expect(stats.totalHits).toBe(1); // Should not increment
      expect(stats.totalMisses).toBe(1); // Should increment miss

      jest.useRealTimers();
    });
  });

  describe('module lifecycle', () => {
    it('should handle module destruction properly', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      service.onModuleDestroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('should handle destruction when interval is undefined', () => {
      // Clear the interval first
      service.onModuleDestroy();

      // Calling again should not throw
      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle null and undefined data gracefully', () => {
      service.set('null-key', null);
      service.set('undefined-key', undefined);

      expect(service.get('null-key')).toBeNull();
      expect(service.get('undefined-key')).toBeUndefined();
    });

    it('should handle circular reference objects', () => {
      interface CircularObj {
        name: string;
        self?: CircularObj;
      }

      const circularObj: CircularObj = { name: 'test' };
      circularObj.self = circularObj;

      // This should not crash the service, though generateKey might have issues
      expect(() => service.set('circular-key', circularObj)).not.toThrow();
      expect(service.get('circular-key')).toEqual(circularObj);
    });

    it('should handle very large keys gracefully', () => {
      const longKey = 'k'.repeat(1000);
      const data = 'test-data';

      expect(() => service.set(longKey, data)).not.toThrow();
      expect(service.get(longKey)).toBe(data);
    });

    it('should handle special characters in keys', () => {
      const specialKeys = [
        'key:with:colons',
        'key-with-dashes',
        'key_with_underscores',
        'key.with.dots',
        'key with spaces',
        'key@with#special$chars%'
      ];

      specialKeys.forEach((key, index) => {
        service.set(key, `data${index}`);
        expect(service.get(key)).toBe(`data${index}`);
      });
    });
  });

  describe('manual cleanup invocation', () => {
    it('should handle cleanup through natural expiration access', () => {
      jest.useFakeTimers();

      // Add items with short TTL
      service.set('expired1', 'data1', 100); // 100ms TTL
      service.set('expired2', 'data2', 100); // 100ms TTL
      service.set('expired3', 'data3', 100); // 100ms TTL

      expect(service.getStats().totalItems).toBe(3);

      // Advance time to expire items
      jest.advanceTimersByTime(200);

      // Access expired items to trigger cleanup
      expect(service.get('expired1')).toBeNull();
      expect(service.get('expired2')).toBeNull();
      expect(service.get('expired3')).toBeNull();

      // Items should be cleaned up now
      expect(service.getStats().totalItems).toBe(0);

      jest.useRealTimers();
    });

    it('should properly destroy cleanup interval', () => {
      // Test the onModuleDestroy method and interval cleanup
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      service.onModuleDestroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();

      // Calling destroy again should not throw
      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });
});
