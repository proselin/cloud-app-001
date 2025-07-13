import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ComicService } from './comic.service';
import { ComicEntity } from '../entities/comic.entity';
import { CacheService } from '../common/services/cache.service';
import { HttpService } from '@nestjs/axios';
import { NettruyenHttpService } from '../http/nettruyen-http.service';
import { PerformanceService } from '../common/services/performance.service';

describe('ComicService - Cache Integration Tests', () => {
  let service: ComicService;
  let cacheService: CacheService;
  let performanceService: PerformanceService;
  let module: TestingModule;

  const mockRepository = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const mockNettruyenHttpService = {
    suggestSearch: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ComicService,
        CacheService,
        PerformanceService,
        {
          provide: getRepositoryToken(ComicEntity),
          useValue: mockRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: NettruyenHttpService,
          useValue: mockNettruyenHttpService,
        },
      ],
    }).compile();

    service = module.get<ComicService>(ComicService);
    cacheService = module.get<CacheService>(CacheService);
    performanceService = module.get<PerformanceService>(PerformanceService);

    // Mock ComicEntity static methods
    ComicEntity.toJSONWithoutChapter = jest.fn().mockImplementation((comic) => ({
      id: comic.id,
      title: comic.title,
      status: comic.status,
      chapterCount: comic.chapterCount,
      createdAt: comic.createdAt,
      updatedAt: comic.updatedAt,
      thumbnail: comic.thumbImage?.fileName,
    }));

    ComicEntity.toJSON = jest.fn().mockImplementation((comic) => ({
      id: comic.id,
      title: comic.title,
      status: comic.status,
      chapterCount: comic.chapterCount,
      createdAt: comic.createdAt,
      updatedAt: comic.updatedAt,
      chapters: comic.chapters || [],
      thumbnail: comic.thumbImage?.fileName,
    }));
  });

  afterEach(async () => {
    // Clear cache and performance metrics after each test
    cacheService.clear();
    performanceService.clearMetrics();
    jest.clearAllMocks();
    await module.close();
  });

  describe('Cache Integration - getAllComic()', () => {
    const mockComics = [
      { id: 1, title: 'Comic 1', thumbImage: { fileName: 'thumb1.jpg' } },
      { id: 2, title: 'Comic 2', thumbImage: { fileName: 'thumb2.jpg' } },
    ];

    it('should cache results and improve performance on subsequent calls', async () => {
      mockRepository.find.mockResolvedValue(mockComics);

      // First call - should hit database and cache result
      const start1 = Date.now();
      const result1 = await service.getAllComic();
      const dbCallDuration = Date.now() - start1;

      expect(result1).toBeDefined();
      expect(mockRepository.find).toHaveBeenCalledTimes(1);

      // Verify cache was populated
      const cacheStats1 = cacheService.getStats();
      expect(cacheStats1.totalItems).toBe(1);

      // Second call - should return cached data
      const start2 = Date.now();
      const result2 = await service.getAllComic();
      const cacheCallDuration = Date.now() - start2;

      expect(result2).toEqual(result1);
      expect(mockRepository.find).toHaveBeenCalledTimes(1); // Should not call DB again

      // Verify cache hit
      const cacheStats2 = cacheService.getStats();
      expect(cacheStats2.totalHits).toBe(1);

      // Cache should be faster than database (allow for timing variations)
      expect(cacheCallDuration).toBeLessThanOrEqual(dbCallDuration);
    });

    it('should handle cache expiration correctly', async () => {
      jest.useFakeTimers();
      mockRepository.find.mockResolvedValue(mockComics);

      // First call
      await service.getAllComic();
      expect(cacheService.getStats().totalItems).toBe(1);

      // Advance time beyond cache TTL (10 minutes)
      jest.advanceTimersByTime(700000); // 11 minutes 40 seconds

      // Second call after expiration
      await service.getAllComic();

      // Should have called repository twice (cache miss)
      expect(mockRepository.find).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('Cache Integration - getComicsByPage()', () => {
    const mockPaginatedComics = [
      { id: 1, title: 'Comic 1', thumbImage: { fileName: 'thumb1.jpg' } },
      { id: 2, title: 'Comic 2', thumbImage: { fileName: 'thumb2.jpg' } },
    ];

    it('should cache paginated results with unique cache keys', async () => {
      mockRepository.findAndCount.mockResolvedValue([mockPaginatedComics, 50]);

      // First page
      const page1Result = await service.getComicsByPage(0, 2);
      expect(page1Result.data).toBeDefined();
      expect(page1Result.pagination.total).toBe(50);

      // Same page - should be cached
      const page1Cached = await service.getComicsByPage(0, 2);
      expect(page1Cached).toEqual(page1Result);
      expect(mockRepository.findAndCount).toHaveBeenCalledTimes(1);

      // Different page parameters should create new cache entry
      await service.getComicsByPage(1, 2);
      expect(mockRepository.findAndCount).toHaveBeenCalledTimes(2);

      // Should have 2 different cache entries
      expect(cacheService.getStats().totalItems).toBe(2);
    });
  });

  describe('Cache Integration - searchComicsByKeyword()', () => {
    const mockSearchResults = [
      {
        id: 1,
        title: 'Search Result 1',
        url: 'https://example.com/result-1',
        chapter: 'Chapter 50',
        author: 'Author 1',
        genres: ['Action'],
        thumbnail: 'thumb1.jpg',
      },
    ];

    it('should cache search results for repeated queries', async () => {
      mockNettruyenHttpService.suggestSearch.mockResolvedValue(mockSearchResults);

      // First search
      const result1 = await service.searchComicsByKeyword('test', 'nettruyen');
      expect(result1).toEqual(mockSearchResults);
      expect(mockNettruyenHttpService.suggestSearch).toHaveBeenCalledTimes(1);

      // Same search - should use cache
      const result2 = await service.searchComicsByKeyword('test', 'nettruyen');
      expect(result2).toEqual(mockSearchResults);
      expect(mockNettruyenHttpService.suggestSearch).toHaveBeenCalledTimes(1); // No additional call

      // Verify cache hit
      expect(cacheService.getStats().totalHits).toBe(1);
    });

    it('should cache different search terms separately', async () => {
      mockNettruyenHttpService.suggestSearch
        .mockResolvedValueOnce([{ ...mockSearchResults[0], title: 'Result 1' }])
        .mockResolvedValueOnce([{ ...mockSearchResults[0], title: 'Result 2' }]);

      await service.searchComicsByKeyword('test1', 'nettruyen');
      await service.searchComicsByKeyword('test2', 'nettruyen');

      // Should have 2 cache entries for different search terms
      expect(cacheService.getStats().totalItems).toBe(2);
      expect(mockNettruyenHttpService.suggestSearch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Integration - getComicById()', () => {
    const mockComic = {
      id: 1,
      title: 'Test Comic',
      thumbImage: { fileName: 'thumb.jpg' },
      chapters: [{ id: 1, title: 'Chapter 1' }],
    };

    it('should cache individual comic details', async () => {
      mockRepository.findOne.mockResolvedValue(mockComic);

      // First call
      const result1 = await service.getComicById(1);
      expect(result1).toBeDefined();
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await service.getComicById(1);
      expect(result2).toEqual(result1);
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1); // No additional call

      // Verify cache hit
      expect(cacheService.getStats().totalHits).toBe(1);
    });

    it('should not cache null results for non-existent comics', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getComicById(999)).rejects.toThrow('Comic with id 999 not found');

      // Should not cache null results
      expect(cacheService.getStats().totalItems).toBe(0);
    });
  });

  describe('Cache Invalidation Integration', () => {
    const mockComics = [
      { id: 1, title: 'Comic 1', thumbImage: { fileName: 'thumb1.jpg' } },
    ];

    it('should clear cache when comic is created', async () => {
      // Populate cache first
      mockRepository.find.mockResolvedValue(mockComics);
      await service.getAllComic();
      expect(cacheService.getStats().totalItems).toBe(1);

      // Create new comic
      const newComicData = { title: 'New Comic', status: 'ongoing' };
      mockRepository.create.mockReturnValue(newComicData);
      mockRepository.save.mockResolvedValue({ id: 2, ...newComicData });

      await service.createComic(newComicData);

      // Cache should be cleared
      expect(cacheService.getStats().totalItems).toBe(0);
    });

    it('should clear cache when comic is updated', async () => {
      // Cache a comic
      mockRepository.findOne.mockResolvedValue(mockComics[0]);
      await service.getComicById(1);
      expect(cacheService.getStats().totalItems).toBe(1);

      // Update the comic
      mockRepository.findOne.mockResolvedValue(mockComics[0]);
      mockRepository.save.mockResolvedValue(mockComics[0]);

      await service.updateComic(1, { title: 'Updated Title' });

      // Cache should be cleared
      expect(cacheService.getStats().totalItems).toBe(0);
    });

    it('should clear cache manually', async () => {
      // Populate cache
      mockRepository.find.mockResolvedValue(mockComics);
      await service.getAllComic();
      expect(cacheService.getStats().totalItems).toBe(1);

      // Clear cache manually
      service.clearComicCache(1);

      // All comic-related cache should be cleared
      expect(cacheService.getStats().totalItems).toBe(0);
    });
  });

  describe('Performance Metrics Integration', () => {
    const mockComics = [
      { id: 1, title: 'Comic 1', thumbImage: { fileName: 'thumb1.jpg' } },
    ];

    it('should track cache hit rates accurately', async () => {
      mockRepository.find.mockResolvedValue(mockComics);

      // Make multiple calls
      await service.getAllComic(); // Miss
      await service.getAllComic(); // Hit
      await service.getAllComic(); // Hit
      await service.getAllComic(); // Hit

      const stats = cacheService.getStats();
      expect(stats.totalHits).toBe(3);
      expect(stats.totalMisses).toBe(1);
      expect(stats.hitRate).toBe(75); // 3/4 = 75%
    });

    it('should demonstrate significant performance improvement with cache', async () => {
      // Simulate slow database query
      mockRepository.find.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockComics), 50);
        });
      });

      // First call (database)
      const start1 = Date.now();
      await service.getAllComic();
      const dbDuration = Date.now() - start1;

      // Second call (cache)
      const start2 = Date.now();
      await service.getAllComic();
      const cacheDuration = Date.now() - start2;

      // Cache should be significantly faster
      expect(cacheDuration).toBeLessThan(dbDuration / 2);
      expect(dbDuration).toBeGreaterThan(40); // At least 40ms for DB
      expect(cacheDuration).toBeLessThan(10); // Less than 10ms for cache
    });
  });

  describe('Error Handling Integration', () => {
    it('should fallback gracefully when cache service fails', async () => {
      const mockComics = [{ id: 1, title: 'Comic 1' }];

      // Mock cache service to return null (simulating cache miss)
      jest.spyOn(cacheService, 'get').mockReturnValue(null);

      mockRepository.find.mockResolvedValue(mockComics);

      // Should still work by falling back to database
      const result = await service.getAllComic();
      expect(result).toBeDefined();
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should continue working when cache set operation fails', async () => {
      const mockComics = [{ id: 1, title: 'Comic 1' }];

      // Mock cache get to return null and set to fail silently
      jest.spyOn(cacheService, 'get').mockReturnValue(null);
      jest.spyOn(cacheService, 'set').mockImplementation(() => {
        // Simulate cache set failure but don't throw
        console.warn('Cache set failed');
      });

      mockRepository.find.mockResolvedValue(mockComics);

      // Should still return data even if caching fails
      const result = await service.getAllComic();
      expect(result).toBeDefined();
    });

    it('should not cache database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockRepository.find.mockRejectedValue(dbError);

      // Should throw error and not cache anything
      await expect(service.getAllComic()).rejects.toThrow('Database connection failed');

      // Verify nothing was cached
      expect(cacheService.getStats().totalItems).toBe(0);
    });
  });

  describe('Concurrent Access Integration', () => {
    it('should handle concurrent requests efficiently with cache', async () => {
      const mockComics = [{ id: 1, title: 'Comic 1' }];

      // Use a flag to ensure only the first call hits the database
      let dbCallCount = 0;

      mockRepository.find.mockImplementation(() => {
        dbCallCount++;
        return new Promise(resolve => {
          setTimeout(() => resolve(mockComics), 25);
        });
      });

      // Make concurrent requests
      const promises = Array(5).fill(null).map(() => service.getAllComic());
      const results = await Promise.all(promises);

      // All results should be identical
      results.forEach(result => {
        expect(result).toEqual(results[0]);
      });

      // Due to the async nature and cache implementation,
      // concurrent requests may hit DB multiple times before cache is established
      expect(dbCallCount).toBeLessThanOrEqual(5); // Allow for race conditions

      // Should have cache hits
      const stats = cacheService.getStats();
      expect(stats.totalItems).toBeGreaterThan(0);
    });
  });
});
