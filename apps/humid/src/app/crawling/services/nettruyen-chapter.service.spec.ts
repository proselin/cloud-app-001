import { Test, TestingModule } from '@nestjs/testing';
import { NettruyenChapterService } from './nettruyen-chapter.service';
import { CrawlingQueueService } from './crawling-queue.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ComicEntity } from '../../entities/comic.entity';
import { ChapterEntity } from '../../entities/chapter.entity';
import { DataSource } from 'typeorm';
import { NettruyenImageService } from './nettruyen-image.service';
import { NettruyenHttpService } from '../../http/nettruyen-http.service';
import { CacheService } from '../../common/services/cache.service';

describe('NettruyenChapterService', () => {
  let service: NettruyenChapterService;

  const mockComicRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockChapterRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
      },
    }),
  };

  const mockImageService = {
    handleCrawlImages: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockCrawlingQueueService = {
    queueImageTask: jest.fn(),
    queueChapterTask: jest.fn(),
    getQueueStatus: jest.fn(),
    isImageQueueBusy: jest.fn(),
    isChapterQueueBusy: jest.fn(),
  };

  const mockCacheService = {
    clearChapterCache: jest.fn(),
    clearComicCache: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
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
          provide: NettruyenImageService,
          useValue: mockImageService,
        },
        {
          provide: NettruyenHttpService,
          useValue: mockHttpService,
        },
        {
          provide: CrawlingQueueService,
          useValue: mockCrawlingQueueService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<NettruyenChapterService>(NettruyenChapterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
