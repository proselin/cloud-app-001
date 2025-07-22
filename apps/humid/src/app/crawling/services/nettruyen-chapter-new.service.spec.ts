import { Test, TestingModule } from '@nestjs/testing';
import { NettruyenChapterService } from './nettruyen-chapter.service';
import { NettruyenHttpService } from '../../http/nettruyen-http.service';
import { NettruyenImageService } from './nettruyen-image.service';
import { CrawlingQueueService } from './crawling-queue.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChapterEntity } from '../../entities/chapter.entity';
import { ComicEntity } from '../../entities/comic.entity';
import { DataSource } from 'typeorm';
import { CrawlingStatus } from '../../common';

describe('NettruyenChapterService', () => {
  let service: NettruyenChapterService;

  const mockComicRepository = {
    findOneByOrFail: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockChapterRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn().mockImplementation((entity) => entity),
      },
    }),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockImageService = {
    handleCrawlImages: jest.fn(),
  };

  const mockCrawlingQueueService = {
    queueImageTask: jest.fn(),
    queueChapterTask: jest.fn(),
    getQueueStatus: jest.fn(),
    isImageQueueBusy: jest.fn(),
    isChapterQueueBusy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NettruyenChapterService,
        {
          provide: getRepositoryToken(ComicEntity),
          useValue: mockComicRepository,
        },
        {
          provide: getRepositoryToken(ChapterEntity),
          useValue: mockChapterRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: NettruyenHttpService,
          useValue: mockHttpService,
        },
        {
          provide: NettruyenImageService,
          useValue: mockImageService,
        },
        {
          provide: CrawlingQueueService,
          useValue: mockCrawlingQueueService,
        },
      ],
    }).compile();

    service = module.get<NettruyenChapterService>(NettruyenChapterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleChapterByComicId', () => {
    it('should process chapters for a given comic ID', async () => {
      // Mock data
      const comicId = 1;
      const mockChapters = [
        {
          id: 1,
          title: 'Chapter 1',
          sourceUrl: 'https://test-url.com/chapter-1',
          crawlStatus: CrawlingStatus.READY_FOR_CRAWL,
          save: jest.fn(),
          images: Promise.resolve([]),
        },
      ];

      // Mock repository responses
      mockChapterRepository.find.mockResolvedValue(mockChapters);
      mockHttpService.get.mockResolvedValue({
        data: '<html>mock html content</html>',
      });
      mockImageService.handleCrawlImages.mockResolvedValue([]);

      // Call the method
      const result = await service.handleChapterByComicId(comicId);

      // Assertions
      expect(mockChapterRepository.find).toHaveBeenCalledWith({
        where: {
          comic: { id: comicId },
          crawlStatus: CrawlingStatus.READY_FOR_CRAWL,
        },
        relations: ['images'],
      });
      expect(result).toBeDefined();
    });

    it('should handle case when no chapters are found', async () => {
      // Mock repository to return empty array
      mockChapterRepository.find.mockResolvedValue([]);

      // Call the method
      const result = await service.handleChapterByComicId(999);

      // Should return empty observable
      expect(result).toBeDefined();
    });
  });
});
