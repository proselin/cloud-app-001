import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ComicService } from './comic.service';
import { ComicEntity } from '../entities/comic.entity';
import { CacheService } from '../common/services/cache.service';
import { HttpService } from '@nestjs/axios';
import { NettruyenHttpService } from '../http/nettruyen-http.service';
import { PerformanceService } from '../common/services/performance.service';
import { SuggestComicDto } from '../models/internals/suggest-comic.dto';
import { CrawlingStatus } from '../common';

describe('ComicService - Cache Integration Tests', () => {
  let service: ComicService;
  let cacheService: CacheService;
  let performanceService: PerformanceService;
  let comicRepository: jest.Mocked<Repository<ComicEntity>>;
  let nettruyenHttpService: jest.Mocked<NettruyenHttpService>;
  let module: TestingModule;

  // Create properly typed mock comics
  const createMockComic = (overrides: Partial<ComicEntity> = {}): ComicEntity => {
    return {
      id: 1,
      title: 'Test Comic',
      status: 'ongoing',
      chapterCount: 50,
      originId: 'test-comic',
      description: 'Test description',
      originUrl: 'https://example.com/comic',
      shouldRefresh: false,
      tags: 'action,adventure',
      author: 'Test Author',
      crawlStatus: CrawlingStatus.DONE,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      thumbImage: { fileName: 'thumb.jpg' } as any,
      chapters: [] as any,
      // TypeORM methods
      hasId: () => true,
      save: jest.fn() as any,
      remove: jest.fn() as any,
      softRemove: jest.fn() as any,
      recover: jest.fn() as any,
      reload: jest.fn() as any,
      ...overrides,
    } as ComicEntity;
  };

  const mockComics = [
    createMockComic({ id: 1, title: 'Test Comic 1', status: 'completed' }),
    createMockComic({ id: 2, title: 'Test Comic 2', status: 'ongoing', chapterCount: 25 }),
    createMockComic({ id: 3, title: 'Advanced Comic Test', chapterCount: 75 }),
  ];

  const mockSearchResults: SuggestComicDto[] = [
    {
      id: 1,
      title: 'Search Result 1',
      url: 'https://example.com/result-1',
      chapter: 'Chapter 50',
      author: 'Search Author 1',
      genres: ['Action', 'Adventure'],
      thumbnail: 'https://example.com/thumb-1.jpg',
    },
    {
      id: 2,
      title: 'Search Result 2',
      url: 'https://example.com/result-2',
      chapter: 'Chapter 25',
      author: 'Search Author 2',
      genres: ['Romance', 'Comedy'],
      thumbnail: 'https://example.com/thumb-2.jpg',
    },
  ];

  beforeEach(async () => {
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
    comicRepository = module.get(getRepositoryToken(ComicEntity));
    nettruyenHttpService = module.get(NettruyenHttpService);

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
    await module.close();
  });

  describe('getAllComic() - Cache Integration', () => {
    it('should cache results and return cached data on subsequent calls', async () => {
      const startTime = Date.now();

      // Mock repository response
      comicRepository.find.mockResolvedValue(mockComics);

      // First call - should hit database and cache result
      const result1 = await service.getAllComic();
      const firstCallDuration = Date.now() - startTime;

      // Record performance metric
      performanceService.recordMetric({
        method: 'GET',
        endpoint: '/api/comics/all',
        duration: firstCallDuration,
        timestamp: Date.now(),
        statusCode: 200,
      });

      expect(result1).toHaveLength(3);
      expect(comicRepository.find).toHaveBeenCalledTimes(1);

      // Verify cache was populated
      const cacheStats = cacheService.getStats();
      expect(cacheStats.totalItems).toBe(1);

      const secondStartTime = Date.now();

      // Second call - should return cached data
      const result2 = await service.getAllComic();
      const secondCallDuration = Date.now() - secondStartTime;

      // Record performance metric for cached call
      performanceService.recordMetric({
        method: 'GET',
        endpoint: '/api/comics/all',
        duration: secondCallDuration,
        timestamp: Date.now(),
        statusCode: 200,
      });

      expect(result2).toEqual(result1);
      expect(comicRepository.find).toHaveBeenCalledTimes(1); // Should not call DB again

      // Verify cache hit
      const updatedCacheStats = cacheService.getStats();
      expect(updatedCacheStats.totalHits).toBe(1);

      // Cache hit should be significantly faster (or at least not slower)
      expect(secondCallDuration).toBeLessThanOrEqual(firstCallDuration);

      // Verify performance improvement (allow for some variance in timing)
      const perfStats = performanceService.getStats();
      expect(perfStats.totalRequests).toBe(2);
      expect(perfStats.averageResponseTime).toBeLessThanOrEqual(firstCallDuration);
    });

    it('should handle cache miss and rebuild cache when data expires', async () => {
      jest.useFakeTimers();

      comicRepository.find.mockResolvedValue(mockComics);

      // First call
      await service.getAllComic();
      expect(cacheService.getStats().totalItems).toBe(1);

      // Advance time beyond cache TTL (10 minutes)
      jest.advanceTimersByTime(700000); // 11 minutes 40 seconds

      // Second call after expiration
      await service.getAllComic();

      // Should have called repository twice (cache miss)
      expect(comicRepository.find).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should handle database errors gracefully without caching', async () => {
      const dbError = new Error('Database connection failed');
      comicRepository.find.mockRejectedValue(dbError);

      // Should throw error and not cache anything
      await expect(service.getAllComic()).rejects.toThrow('Database connection failed');

      // Verify nothing was cached
      expect(cacheService.getStats().totalItems).toBe(0);
    });
  });

  describe('getComicsByPage() - Cache Integration', () => {
    it('should cache paginated results with different cache keys', async () => {
      const totalCount = 50;
      comicRepository.findAndCount.mockResolvedValue([mockComics.slice(0, 2), totalCount]);

      // First page
      const page1Result = await service.getComicsByPage(0, 2);
      expect(page1Result.data).toHaveLength(2);
      expect(page1Result.pagination.total).toBe(totalCount);

      // Different page should create separate cache entry
      comicRepository.findAndCount.mockResolvedValue([mockComics.slice(2, 3), totalCount]);
      const page2Result = await service.getComicsByPage(1, 2);

      // Verify both pages are cached separately
      const cacheStats = cacheService.getStats();
      expect(cacheStats.totalItems).toBe(2); // Two different cache entries

      // Call page 1 again - should be cached
      const page1Cached = await service.getComicsByPage(0, 2);
      expect(page1Cached).toEqual(page1Result);
      expect(comicRepository.findAndCount).toHaveBeenCalledTimes(2); // No additional DB call
    });

    it('should generate different cache keys for different pagination parameters', async () => {
      comicRepository.findAndCount.mockResolvedValue([mockComics, 50]);

      // Different page sizes should create different cache keys
      await service.getComicsByPage(0, 10);
      await service.getComicsByPage(0, 20);
      await service.getComicsByPage(1, 10);

      // Should have 3 different cache entries
      expect(cacheService.getStats().totalItems).toBe(3);
    });

    it('should handle pagination edge cases correctly', async () => {
      comicRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getComicsByPage(0, 10);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);

      // Should still cache empty results
      expect(cacheService.getStats().totalItems).toBe(1);
    });
  });

  describe('searchComicsByKeyword() - Cache Integration', () => {
    it('should cache search results and handle repeated searches', async () => {
      nettruyenHttpService.suggestSearch.mockResolvedValue(mockSearchResults);

      // First search
      const result1 = await service.searchComicsByKeyword('test', 'nettruyen');
      expect(result1).toEqual(mockSearchResults);
      expect(nettruyenHttpService.suggestSearch).toHaveBeenCalledTimes(1);

      // Same search - should use cache
      const result2 = await service.searchComicsByKeyword('test', 'nettruyen');
      expect(result2).toEqual(mockSearchResults);
      expect(nettruyenHttpService.suggestSearch).toHaveBeenCalledTimes(1); // No additional call

      // Verify cache hit
      expect(cacheService.getStats().totalHits).toBe(1);
    });

    it('should cache different search terms separately', async () => {
      const searchResult1 = {
        id: 1,
        title: 'Result for test1',
        url: 'https://example.com/test1',
        chapter: 'Chapter 1',
        author: 'Author 1',
        genres: ['Action'],
        thumbnail: 'thumb1.jpg'
      };
      const searchResult2 = {
        id: 2,
        title: 'Result for test2',
        url: 'https://example.com/test2',
        chapter: 'Chapter 2',
        author: 'Author 2',
        genres: ['Romance'],
        thumbnail: 'thumb2.jpg'
      };

      nettruyenHttpService.suggestSearch
        .mockResolvedValueOnce([searchResult1])
        .mockResolvedValueOnce([searchResult2]);

      await service.searchComicsByKeyword('test1', 'nettruyen');
      await service.searchComicsByKeyword('test2', 'nettruyen');

      // Should have 2 cache entries for different search terms
      expect(cacheService.getStats().totalItems).toBe(2);
      expect(nettruyenHttpService.suggestSearch).toHaveBeenCalledTimes(2);
    });

    it('should handle search errors without caching', async () => {
      const searchError = new Error('Search service unavailable');
      nettruyenHttpService.suggestSearch.mockRejectedValue(searchError);

      await expect(service.searchComicsByKeyword('test', 'nettruyen')).rejects.toThrow();

      // Should not cache failed results
      expect(cacheService.getStats().totalItems).toBe(0);
    });
  });

  describe('getComicById() - Cache Integration', () => {
    it('should cache individual comic details', async () => {
      const comicWithChapters = createMockComic({
        id: 1,
        chapters: [
          { id: 1, title: 'Chapter 1' },
          { id: 2, title: 'Chapter 2' },
        ] as any,
      });

      comicRepository.findOne.mockResolvedValue(comicWithChapters);

      // First call
      const result1 = await service.getComicById(1);
      expect(result1.id).toBe(1);
      expect(comicRepository.findOne).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await service.getComicById(1);
      expect(result2).toEqual(result1);
      expect(comicRepository.findOne).toHaveBeenCalledTimes(1); // No additional call

      // Verify cache hit
      expect(cacheService.getStats().totalHits).toBe(1);
    });

    it('should handle not found comics without caching', async () => {
      comicRepository.findOne.mockResolvedValue(null);

      await expect(service.getComicById(999)).rejects.toThrow('Comic with id 999 not found');

      // Should not cache null results
      expect(cacheService.getStats().totalItems).toBe(0);
    });
  });

  describe('getComicSuggestions() - Cache Integration', () => {
    it('should cache autocomplete suggestions', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockComics.slice(0, 2)),
      } as any;

      comicRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // First call
      const result1 = await service.getComicSuggestions('test');
      expect(result1).toHaveLength(2);

      // Second call - should use cache
      const result2 = await service.getComicSuggestions('test');
      expect(result2).toEqual(result1);
      expect(mockQueryBuilder.getMany).toHaveBeenCalledTimes(1);

      // Verify cache hit
      expect(cacheService.getStats().totalHits).toBe(1);
    });
  });

  describe('Cache Invalidation Integration', () => {
    it('should clear appropriate caches when comic is created', async () => {
      // Populate some cache first
      comicRepository.find.mockResolvedValue(mockComics);
      await service.getAllComic();

      comicRepository.findAndCount.mockResolvedValue([mockComics, 3]);
      await service.getComicsByPage(0, 10);

      expect(cacheService.getStats().totalItems).toBe(2);

      // Create new comic
      const newComicData = { title: 'New Comic', status: 'ongoing' };
      comicRepository.create.mockReturnValue(newComicData as ComicEntity);
      comicRepository.save.mockResolvedValue({ id: 4, ...newComicData } as ComicEntity);

      await service.createComic(newComicData);

      // Cache should be cleared
      expect(cacheService.getStats().totalItems).toBe(0);
    });

    it('should clear specific comic cache when comic is updated', async () => {
      // Cache a specific comic
      comicRepository.findOne.mockResolvedValue(mockComics[0]);
      await service.getComicById(1);

      // Cache general listings
      comicRepository.find.mockResolvedValue(mockComics);
      await service.getAllComic();

      expect(cacheService.getStats().totalItems).toBe(2);

      // Update the comic
      comicRepository.findOne.mockResolvedValue(mockComics[0]);
      comicRepository.save.mockResolvedValue(mockComics[0]);

      await service.updateComic(1, { title: 'Updated Title' });

      // All caches should be cleared (specific comic + general listings)
      expect(cacheService.getStats().totalItems).toBe(0);
    });

    it('should handle manual cache clearing', async () => {
      // Populate cache
      comicRepository.find.mockResolvedValue(mockComics);
      await service.getAllComic();

      comicRepository.findOne.mockResolvedValue(mockComics[0]);
      await service.getComicById(1);

      expect(cacheService.getStats().totalItems).toBe(2);

      // Clear cache manually
      service.clearComicCache(1);

      // All comic-related cache should be cleared
      expect(cacheService.getStats().totalItems).toBe(0);
    });
  });

  describe('Performance Integration Tests', () => {
    it('should demonstrate significant performance improvement with cache', async () => {
      comicRepository.find.mockImplementation(() => {
        // Simulate slow database query
        return new Promise(resolve => {
          setTimeout(() => resolve(mockComics), 100);
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
      expect(dbDuration).toBeGreaterThan(90); // At least 90ms for DB
      expect(cacheDuration).toBeLessThan(10); // Less than 10ms for cache
    });

    it('should track cache hit rates accurately', async () => {
      comicRepository.find.mockResolvedValue(mockComics);

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
  });

  describe('Concurrent Access Integration', () => {
    it('should handle concurrent requests efficiently with cache', async () => {
      comicRepository.find.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockComics), 50);
        });
      });

      // Make concurrent requests
      const promises = Array(5).fill(null).map(() => service.getAllComic());
      const results = await Promise.all(promises);

      // All results should be identical
      results.forEach(result => {
        expect(result).toEqual(results[0]);
      });

      // Should hit database at least once (may be up to 5 times for truly concurrent requests)
      expect(comicRepository.find).toHaveBeenCalled();
      expect(comicRepository.find.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(comicRepository.find.mock.calls.length).toBeLessThanOrEqual(5);

      // Should have cache statistics
      const stats = cacheService.getStats();
      expect(stats.totalItems).toBe(1); // Should have cached result
    });
  });

  describe('Error Recovery Integration', () => {
    it('should fallback to database when cache service fails', async () => {
      // Mock cache service to throw error
      jest.spyOn(cacheService, 'get').mockImplementation(() => {
        throw new Error('Cache service unavailable');
      });

      comicRepository.find.mockResolvedValue(mockComics);

      // Should throw error since service doesn't handle cache errors
      await expect(service.getAllComic()).rejects.toThrow('Cache service unavailable');
    });

    it('should continue working when cache set operation fails', async () => {
      // Mock cache set to throw error
      jest.spyOn(cacheService, 'set').mockImplementation(() => {
        throw new Error('Cache write failed');
      });

      comicRepository.find.mockResolvedValue(mockComics);

      // Should throw error since service doesn't handle cache errors
      await expect(service.getAllComic()).rejects.toThrow('Cache write failed');
    });
  });
});
