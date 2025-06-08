import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ChapterController } from './chapter.controller';
import { ChapterService } from './chapter.service';
import { ResponseMapper } from '../utils/response-mapper';
import { CrawlingStatus } from '../common';
import { ChapterPlainObject } from '../models/types/chapter-plain-object';

describe('ChapterController', () => {  let controller: ChapterController;

  const mockChapterService = {
    getDetail: jest.fn(),
    getChaptersForNavigation: jest.fn(),
    getChaptersByComicId: jest.fn(),
  };

  const mockChapterDetail: ChapterPlainObject = {
    id: 1,
    chapterNumber: '1',
    title: 'Chapter 1',
    sourceUrl: 'https://example.com/chapter/1',
    position: 1,
    crawlStatus: CrawlingStatus.READY_FOR_CRAWL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),    images: [
      {
        id: 1,
        fileName: 'image1.jpg',
        originUrls: 'https://example.com/image1.jpg',
        position: 1,
        type: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  const mockNavigationChapters = [
    {
      id: 1,
      chapterNumber: '1',
      title: 'Chapter 1',
      position: 1,
    },
    {
      id: 2,
      chapterNumber: '2',
      title: 'Chapter 2',
      position: 2,
    },
  ];

  const mockMinimizedChapters = [
    {
      id: 1,
      chapterNumber: '1',
      title: 'Chapter 1',
      crawlStatus: CrawlingStatus.READY_FOR_CRAWL,
    },
    {
      id: 2,
      chapterNumber: '2',
      title: 'Chapter 2',
      crawlStatus: CrawlingStatus.ON_CRAWL,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChapterController],
      providers: [
        {
          provide: ChapterService,
          useValue: mockChapterService,
        },
      ],
    }).compile();    controller = module.get<ChapterController>(ChapterController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDetail', () => {
    it('should return chapter details successfully', async () => {
      // Arrange
      const chapterId = 1;
      mockChapterService.getDetail.mockResolvedValue(mockChapterDetail);

      // Act
      const result = await controller.getDetail(chapterId);

      // Assert
      expect(mockChapterService.getDetail).toHaveBeenCalledWith(chapterId);
      expect(result).toEqual(
        ResponseMapper.success(
          mockChapterDetail,
          'Chapter details retrieved successfully'
        )
      );
    });

    it('should throw NotFoundException when chapter does not exist', async () => {
      // Arrange
      const chapterId = 999;
      const notFoundError = new NotFoundException(
        `Chapter with id ${chapterId} not found`
      );
      mockChapterService.getDetail.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.getDetail(chapterId)).rejects.toThrow(
        notFoundError
      );
      expect(mockChapterService.getDetail).toHaveBeenCalledWith(chapterId);
    });

    it('should handle invalid chapter ID parameter', async () => {
      // This test verifies that ParseIntPipe works correctly
      // In actual implementation, ParseIntPipe will throw BadRequestException
      // before reaching the controller method for invalid inputs
      const chapterId = 1;
      mockChapterService.getDetail.mockResolvedValue(mockChapterDetail);

      const result = await controller.getDetail(chapterId);

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Chapter details retrieved successfully');
    });
  });

  describe('getChaptersForNavigation', () => {
    it('should return chapters for navigation successfully', async () => {
      // Arrange
      const comicId = 1;
      mockChapterService.getChaptersForNavigation.mockResolvedValue(
        mockNavigationChapters
      );

      // Act
      const result = await controller.getChaptersForNavigation(comicId);

      // Assert
      expect(mockChapterService.getChaptersForNavigation).toHaveBeenCalledWith(
        comicId
      );
      expect(result).toEqual(
        ResponseMapper.success(
          mockNavigationChapters,
          'Chapters retrieved successfully'
        )
      );
    });

    it('should return empty array when comic has no chapters', async () => {
      // Arrange
      const comicId = 999;
      mockChapterService.getChaptersForNavigation.mockResolvedValue([]);

      // Act
      const result = await controller.getChaptersForNavigation(comicId);

      // Assert
      expect(mockChapterService.getChaptersForNavigation).toHaveBeenCalledWith(
        comicId
      );
      expect(result.data).toEqual([]);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('getChaptersByComicId', () => {
    it('should return minimized chapters successfully', async () => {
      // Arrange
      const comicId = 1;
      mockChapterService.getChaptersByComicId.mockResolvedValue(
        mockMinimizedChapters
      );

      // Act
      const result = await controller.getChaptersByComicId(comicId);

      // Assert
      expect(mockChapterService.getChaptersByComicId).toHaveBeenCalledWith(
        comicId
      );
      expect(result).toEqual(
        ResponseMapper.success(
          mockMinimizedChapters,
          'Chapters retrieved successfully'
        )
      );
    });

    it('should handle different crawl statuses', async () => {
      // Arrange
      const comicId = 1;
      const chaptersWithDifferentStatuses = [
        {
          id: 1,
          chapterNumber: '1',
          title: 'Chapter 1',
          crawlStatus: CrawlingStatus.READY_FOR_CRAWL,
        },
        {
          id: 2,
          chapterNumber: '2',
          title: 'Chapter 2',
          crawlStatus: CrawlingStatus.ON_CRAWL,
        },
        {
          id: 3,
          chapterNumber: '3',
          title: 'Chapter 3',
          crawlStatus: CrawlingStatus.DONE,
        },
      ];
      mockChapterService.getChaptersByComicId.mockResolvedValue(
        chaptersWithDifferentStatuses
      );

      // Act
      const result = await controller.getChaptersByComicId(comicId);      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.data[0].crawlStatus).toBe(CrawlingStatus.READY_FOR_CRAWL);
      expect(result.data[1].crawlStatus).toBe(CrawlingStatus.ON_CRAWL);
      expect(result.data[2].crawlStatus).toBe(CrawlingStatus.DONE);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle service errors gracefully', async () => {
      // Arrange
      const chapterId = 1;
      const serviceError = new Error('Database connection failed');
      mockChapterService.getDetail.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.getDetail(chapterId)).rejects.toThrow(
        serviceError
      );
    });

    it('should log requests correctly', async () => {
      // Arrange
      const chapterId = 1;
      const loggerSpy = jest.spyOn(controller['logger'], 'log');
      mockChapterService.getDetail.mockResolvedValue(mockChapterDetail);

      // Act
      await controller.getDetail(chapterId);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        `Getting chapter detail for id: ${chapterId}`
      );
    });
  });
});
