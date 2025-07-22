/**
 * Integration test for the single chapter crawling endpoint
 * This tests the new POST /api/v1/crawl/chapter endpoint
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CrawlController } from './crawl.controller';
import { NettruyenComicService } from '../services/nettruyen-comic.service';
import { NettruyenChapterService } from '../services/nettruyen-chapter.service';
import { CrawlingQueueService } from '../services/crawling-queue.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChapterEntity } from '../../entities/chapter.entity';

describe('CrawlController - Single Chapter', () => {
  let controller: CrawlController;
  let chapterService: NettruyenChapterService;
  let crawlingQueue: CrawlingQueueService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chapterRepository: any;

  beforeEach(async () => {
    const mockChapterService = {
      handleCrawlChapter: jest.fn(),
    };

    const mockCrawlingQueue = {
      queueChapterTask: jest.fn(),
    };

    const mockComicService = {
      getComicByUrl: jest.fn(),
    };

    const mockChapterRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrawlController],
      providers: [
        {
          provide: NettruyenChapterService,
          useValue: mockChapterService,
        },
        {
          provide: CrawlingQueueService,
          useValue: mockCrawlingQueue,
        },
        {
          provide: NettruyenComicService,
          useValue: mockComicService,
        },
        {
          provide: getRepositoryToken(ChapterEntity),
          useValue: mockChapterRepository,
        },
      ],
    }).compile();

    controller = module.get<CrawlController>(CrawlController);
    chapterService = module.get<NettruyenChapterService>(NettruyenChapterService);
    crawlingQueue = module.get<CrawlingQueueService>(CrawlingQueueService);
    chapterRepository = module.get(getRepositoryToken(ChapterEntity));
  });

  describe('crawlChapter', () => {
    it('should crawl a single chapter successfully', async () => {
      // Arrange
      const requestDto = { chapterId: 789 };

      const mockChapterEntity = {
        id: 789,
        chapterNumber: '1.5',
        sourceUrl: 'https://example.com/chapter/123',
        title: 'Chapter 1.5',
        position: 1,
        crawlStatus: 'completed',
        comic: Promise.resolve({ id: 456, title: 'Amazing Comic Series' }),
        images: Promise.resolve([{ id: 1 }, { id: 2 }, { id: 3 }]), // 3 images
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      // Mock repository to return the chapter
      chapterRepository.findOne.mockResolvedValue(mockChapterEntity);

      // Mock the queue to execute the task immediately
      (crawlingQueue.queueChapterTask as jest.Mock).mockImplementation(async (task) => {
        return await task.execute();
      });

      (chapterService.handleCrawlChapter as jest.Mock).mockResolvedValue(mockChapterEntity);

      // Act
      const result = await controller.crawlChapter(requestDto);

      // Assert
      expect(chapterRepository.findOne).toHaveBeenCalledWith({
        where: { id: 789 },
        relations: ['comic'],
      });

      expect(crawlingQueue.queueChapterTask).toHaveBeenCalledWith({
        id: `chapter-789`,
        priority: 1,
        execute: expect.any(Function),
      });

      expect(chapterService.handleCrawlChapter).toHaveBeenCalledWith({
        url: 'https://example.com/chapter/123',
        chapNumber: '1.5',
        comicId: 456,
        position: 1,
      });

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Chapter crawled successfully');
      expect(result.data).toBeDefined();
      expect(result.data).toMatchObject({
        chapterId: 789,
        chapterNumber: '1.5',
        chapterTitle: 'Chapter 1.5',
        chapterUrl: 'https://example.com/chapter/123',
        position: 1,
        crawlStatus: 'completed',
        comicId: 456,
        comicTitle: 'Amazing Comic Series',
        imageCount: 3,
        status: 'completed',
        message: 'Chapter crawled successfully',
      });
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.crawledAt).toBeDefined();
        expect(result.data.createdAt).toBeDefined();
        expect(result.data.updatedAt).toBeDefined();
      }
    });

    it('should handle chapter crawling errors', async () => {
      // Arrange
      const requestDto = { chapterId: 789 };

      const mockChapterEntity = {
        id: 789,
        chapterNumber: '1.5',
        sourceUrl: 'https://example.com/chapter/123',
        title: 'Chapter 1.5',
        position: 1,
        crawlStatus: 'pending',
        comic: Promise.resolve({ id: 456 }),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const errorMessage = 'Network timeout';

      // Mock repository to return the chapter
      chapterRepository.findOne.mockResolvedValue(mockChapterEntity);

      // Mock the queue to execute the task and throw an error
      (crawlingQueue.queueChapterTask as jest.Mock).mockImplementation(async (task) => {
        return await task.execute();
      });

      (chapterService.handleCrawlChapter as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await controller.crawlChapter(requestDto);

      // Assert
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Failed to crawl chapter');
      expect(result.data).toMatchObject({
        chapterId: 789,
        chapterNumber: 'N/A', // In error cases, it's N/A
        chapterTitle: 'N/A',
        chapterUrl: 'N/A',
        position: 0,
        crawlStatus: 'failed',
        comicId: 0,
        comicTitle: 'N/A',
        imageCount: 0,
        status: 'failed',
        message: errorMessage,
      });
    });

    it('should handle queue errors', async () => {
      // Arrange
      const requestDto = { chapterId: 789 };

      const mockChapterEntity = {
        id: 789,
        chapterNumber: '1.5',
        sourceUrl: 'https://example.com/chapter/123',
        title: 'Chapter 1.5',
        position: 1,
        crawlStatus: 'pending',
        comic: Promise.resolve({ id: 456 }),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const errorMessage = 'Queue is full';

      // Mock repository to return the chapter
      chapterRepository.findOne.mockResolvedValue(mockChapterEntity);

      (crawlingQueue.queueChapterTask as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await controller.crawlChapter(requestDto);

      // Assert
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Failed to crawl chapter');
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.status).toBe('failed');
        expect(result.data.message).toBe(errorMessage);
      }
    });

    it('should handle chapters with no images', async () => {
      // Arrange
      const requestDto = { chapterId: 790 };

      const mockChapterEntity = {
        id: 790,
        chapterNumber: '2.0',
        sourceUrl: 'https://example.com/chapter/empty',
        title: 'Chapter 2.0',
        position: 2,
        crawlStatus: 'completed',
        comic: Promise.resolve({ id: 456 }),
        images: Promise.resolve([]), // No images
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      // Mock repository to return the chapter
      chapterRepository.findOne.mockResolvedValue(mockChapterEntity);

      (crawlingQueue.queueChapterTask as jest.Mock).mockImplementation(async (task) => {
        return await task.execute();
      });

      (chapterService.handleCrawlChapter as jest.Mock).mockResolvedValue(mockChapterEntity);

      // Act
      const result = await controller.crawlChapter(requestDto);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.imageCount).toBe(0);
        expect(result.data.status).toBe('completed');
      }
    });

    it('should handle chapter not found', async () => {
      // Arrange
      const requestDto = { chapterId: 999 };

      // Mock repository to return null (chapter not found)
      chapterRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await controller.crawlChapter(requestDto);

      // Assert
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('Chapter not found');
      expect(result.data).toBeNull(); // Controller returns null for not found case
    });
  });
});
