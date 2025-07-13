import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ComicService } from './comic.service';
import { ComicEntity } from '../entities/comic.entity';
import { NettruyenHttpService } from '../http/nettruyen-http.service';
import { CacheService } from '../common/services/cache.service';

describe('ComicService - Caching', () => {
  let service: ComicService;
  let cacheService: CacheService;

  const mockComicRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockNettruyenHttpService = {
    suggestSearch: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clearPattern: jest.fn(),
    generateKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComicService,
        {
          provide: getRepositoryToken(ComicEntity),
          useValue: mockComicRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: NettruyenHttpService,
          useValue: mockNettruyenHttpService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<ComicService>(ComicService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllComic', () => {
    it('should return cached data when available', async () => {
      // Arrange
      const cachedData = [{ id: 1, title: 'Test Comic' }];
      mockCacheService.get.mockReturnValue(cachedData);

      // Act
      const result = await service.getAllComic();

      // Assert
      expect(result).toEqual(cachedData);
      expect(mockCacheService.get).toHaveBeenCalledWith('comics:all');
      expect(mockComicRepository.find).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when no cached data', async () => {
      // Arrange
      const mockComics = [{ id: 1, title: 'Test Comic', status: 'active', chapterCount: 5, createdAt: new Date(), updatedAt: new Date() }];
      mockCacheService.get.mockReturnValue(null);
      mockComicRepository.find.mockResolvedValue(mockComics);

      // Mock the toJSONWithoutChapter method
      ComicEntity.toJSONWithoutChapter = jest.fn().mockResolvedValue(mockComics[0]);

      // Act
      const result = await service.getAllComic();

      // Assert
      expect(mockCacheService.get).toHaveBeenCalledWith('comics:all');
      expect(mockComicRepository.find).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith('comics:all', expect.any(Array), 600000);
    });
  });

  describe('getComicById', () => {
    it('should return cached comic when available', async () => {
      // Arrange
      const comicId = 1;
      const cachedComic = { id: 1, title: 'Cached Comic' };
      mockCacheService.get.mockReturnValue(cachedComic);

      // Act
      const result = await service.getComicById(comicId);

      // Assert
      expect(result).toEqual(cachedComic);
      expect(mockCacheService.get).toHaveBeenCalledWith(`comic:${comicId}`);
      expect(mockComicRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when no cached data', async () => {
      // Arrange
      const comicId = 1;
      const mockComic = { id: 1, title: 'Test Comic', chapters: [], thumbImage: null };
      mockCacheService.get.mockReturnValue(null);
      mockComicRepository.findOne.mockResolvedValue(mockComic);

      // Mock the toJSON method
      ComicEntity.toJSON = jest.fn().mockResolvedValue(mockComic);

      // Act
      const result = await service.getComicById(comicId);

      // Assert
      expect(mockCacheService.get).toHaveBeenCalledWith(`comic:${comicId}`);
      expect(mockComicRepository.findOne).toHaveBeenCalledWith({
        where: { id: comicId },
        relations: ['chapters', 'thumbImage'],
      });
      expect(mockCacheService.set).toHaveBeenCalledWith(`comic:${comicId}`, mockComic, 1800000);
    });
  });

  describe('searchComicsByKeyword', () => {
    it('should return cached search results when available', async () => {
      // Arrange
      const keyword = 'test';
      const cachedResults = [{ id: 1, title: 'Test Comic' }];
      mockCacheService.generateKey.mockReturnValue('comics:search:hash123');
      mockCacheService.get.mockReturnValue(cachedResults);

      // Act
      const result = await service.searchComicsByKeyword(keyword, 'nettruyen');

      // Assert
      expect(result).toEqual(cachedResults);
      expect(mockCacheService.generateKey).toHaveBeenCalledWith('comics:search', { key: keyword, model: 'nettruyen' });
      expect(mockCacheService.get).toHaveBeenCalledWith('comics:search:hash123');
      expect(mockNettruyenHttpService.suggestSearch).not.toHaveBeenCalled();
    });
  });

  describe('clearComicCache', () => {
    it('should clear specific comic cache and all comic patterns', () => {
      // Arrange
      const comicId = 1;

      // Act
      service.clearComicCache(comicId);

      // Assert
      expect(mockCacheService.delete).toHaveBeenCalledWith(`comic:${comicId}`);
      expect(mockCacheService.clearPattern).toHaveBeenCalledWith('comics:*');
    });

    it('should clear all comic patterns when no specific id provided', () => {
      // Act
      service.clearComicCache();

      // Assert
      expect(mockCacheService.delete).not.toHaveBeenCalled();
      expect(mockCacheService.clearPattern).toHaveBeenCalledWith('comics:*');
    });
  });
});
