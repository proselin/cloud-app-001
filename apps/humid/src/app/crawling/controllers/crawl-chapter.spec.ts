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

  beforeEach(async () => {
    const mockChapterService = {
      crawlIndividualChapter: jest.fn(),
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
  });

  describe('crawlChapter', () => {
    it('should crawl a single chapter successfully', async () => {
      // Arrange
      const requestDto = { chapterId: 789 };

      const mockResponse = {
        chapterId: 789,
        chapterNumber: '1.5',
        chapterTitle: 'Chapter 1.5',
        chapterUrl: 'https://example.com/chapter/123',
        position: 1,
        crawlStatus: 'completed',
        comicId: 456,
        comicTitle: 'Amazing Comic Series',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      (chapterService.crawlIndividualChapter as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await controller.crawlChapter(requestDto);

      // Assert
      expect(chapterService.crawlIndividualChapter).toHaveBeenCalledWith(requestDto);
      expect(result).toEqual(mockResponse);
    });

    it('should handle chapter crawling errors', async () => {
      // Arrange
      const requestDto = { chapterId: 789 };

      const mockErrorResponse = {
        chapterId: 789,
        chapterNumber: 'N/A',
        chapterTitle: 'N/A',
        chapterUrl: 'N/A',
        position: 0,
        crawlStatus: 'failed',
        comicId: 0,
        comicTitle: 'N/A',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      (chapterService.crawlIndividualChapter as jest.Mock).mockResolvedValue(mockErrorResponse);

      // Act
      const result = await controller.crawlChapter(requestDto);

      // Assert
      expect(chapterService.crawlIndividualChapter).toHaveBeenCalledWith(requestDto);
      expect(result).toEqual(mockErrorResponse);
    });

    it('should handle service exceptions', async () => {
      // Arrange
      const requestDto = { chapterId: 789 };

      (chapterService.crawlIndividualChapter as jest.Mock).mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(controller.crawlChapter(requestDto)).rejects.toThrow('Service error');
      expect(chapterService.crawlIndividualChapter).toHaveBeenCalledWith(requestDto);
    });

    it('should handle chapter not found', async () => {
      // Arrange
      const requestDto = { chapterId: 999 };

      (chapterService.crawlIndividualChapter as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await controller.crawlChapter(requestDto);

      // Assert
      expect(chapterService.crawlIndividualChapter).toHaveBeenCalledWith(requestDto);
      expect(result).toBeNull();
    });
  });
});
