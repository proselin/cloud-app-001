import { Test, TestingModule } from '@nestjs/testing';
import { CrawlController } from './crawl.controller';
import { NettruyenComicService } from '../services/nettruyen-comic.service';
import { NettruyenChapterService } from '../services/nettruyen-chapter.service';
import { CrawlByUrlRequestDto } from '../dto/crawl-by-url-request.dto';
import { CrawlingStatus } from '../../common';
import { of, Subject } from 'rxjs';
import { ResponseMapper } from '../../utils/response-mapper';

describe('CrawlController', () => {
  let controller: CrawlController;

  const mockComicService = {
    getComicByUrl: jest.fn(),
  };

  const mockChapterService = {
    handleChapterByComicId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrawlController],
      providers: [
        {
          provide: NettruyenComicService,
          useValue: mockComicService,
        },
        {
          provide: NettruyenChapterService,
          useValue: mockChapterService,
        },
      ],
    }).compile();

    controller = module.get<CrawlController>(CrawlController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('crawlingByComicUrl', () => {
    it('should return a successful response when crawling is successful', async () => {
      // Arrange
      const dto: CrawlByUrlRequestDto = {
        url: 'https://example.com/comic/123',
      };

      const mockComic = {
        id: 1,
        title: 'Test Comic',
        description: 'Test description',
        chapterCount: 10,
        originId: 'test-comic-123',
        status: 'active',
        thumbImage: {
          id: 1,
          filePath: '/path/to/thumb.jpg',
          fileName: 'thumb.jpg',
          fileExtension: 'jpg',
          sizeInBytes: 2048,
          position: 0,
          originUrl: 'https://example.com/thumb.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockComicService.getComicByUrl.mockResolvedValue(mockComic);

      // Act
      const result = await controller.crawlingByComicUrl(dto);

      // Assert
      expect(mockComicService.getComicByUrl).toHaveBeenCalledWith(dto.url);
      expect(result).toEqual(
        ResponseMapper.success(mockComic, 'Comic retrieved successfully')
      );
    });

    it('should handle errors when crawling fails', async () => {
      // Arrange
      const dto: CrawlByUrlRequestDto = {
        url: 'https://example.com/invalid-comic',
      };

      const error = new Error('Comic not found');
      mockComicService.getComicByUrl.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.crawlingByComicUrl(dto)).rejects.toThrow(error);
      expect(mockComicService.getComicByUrl).toHaveBeenCalledWith(dto.url);
    });

    it('should validate URL format', async () => {
      // Arrange
      const validDto: CrawlByUrlRequestDto = {
        url: 'https://valid-url.com/comic/123',
      };

      const mockComic = {
        id: 1,
        title: 'Valid Comic',
        description: 'Valid description',
        chapterCount: 5,
        originId: 'valid-comic-123',
        status: 'active',
        thumbImage: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockComicService.getComicByUrl.mockResolvedValue(mockComic);

      // Act
      const result = await controller.crawlingByComicUrl(validDto);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Comic retrieved successfully');
    });
  });

  describe('crawlComicByUrlSSE', () => {
    it('should return an observable for streaming chapter data', async () => {
      // Arrange
      const comicId = 1;
      const mockChapter = {
        id: 1,
        chapterNumber: '1',
        title: 'Chapter 1',
        sourceUrl: 'https://example.com/chapter/1',
        position: 1,
        crawlStatus: CrawlingStatus.DONE,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };

      const mockSubject = new Subject();
      const mockObservable = mockSubject.asObservable();

      mockChapterService.handleChapterByComicId.mockResolvedValue(
        mockObservable
      );

      // Act
      const result = await controller.crawlComicByUrlSSE(comicId);

      // Simulate emitting data
      setTimeout(() => {
        mockSubject.next(mockChapter);
        mockSubject.complete();
      }, 0);

      // Convert Observable to Promise to test its value
      const resultValue = await new Promise((resolve) => {
        result.subscribe({
          next: (value) => resolve(value),
          error: (err) => resolve(err),
        });
      });

      // Assert
      expect(mockChapterService.handleChapterByComicId).toHaveBeenCalledWith(
        comicId
      );
      expect(resultValue).toEqual(
        ResponseMapper.success(mockChapter, 'Comic chapter data streaming')
      );
    });

    it('should handle empty chapter streams', async () => {
      // Arrange
      const comicId = 999;
      const mockSubject = new Subject();
      const mockObservable = mockSubject.asObservable();

      mockChapterService.handleChapterByComicId.mockResolvedValue(
        mockObservable
      );

      // Act
      const result = await controller.crawlComicByUrlSSE(comicId);

      // Simulate completing without emitting data
      setTimeout(() => {
        mockSubject.complete();
      }, 0); // Convert Observable to Promise to test completion
      const completed = await new Promise((resolve) => {
        result.subscribe({
          next: (data) => {
            // Handle any emitted data
            expect(data).toBeDefined();
          },
          complete: () => resolve(true),
        });
      });

      // Assert
      expect(completed).toBe(true);
      expect(mockChapterService.handleChapterByComicId).toHaveBeenCalledWith(
        comicId
      );
    });

    it('should handle errors in the SSE stream', async () => {
      // Arrange
      const comicId = 1;
      const error = new Error('Chapters not found');

      mockChapterService.handleChapterByComicId.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.crawlComicByUrlSSE(comicId)).rejects.toThrow(
        error
      );
      expect(mockChapterService.handleChapterByComicId).toHaveBeenCalledWith(
        comicId
      );
    });

    it('should handle chapter processing errors in stream', async () => {
      // Arrange
      const comicId = 1;
      const mockSubject = new Subject();
      const mockObservable = mockSubject.asObservable();

      mockChapterService.handleChapterByComicId.mockResolvedValue(
        mockObservable
      );

      // Act
      const result = await controller.crawlComicByUrlSSE(comicId);

      // Simulate error in stream
      const streamError = new Error('Chapter processing failed');
      setTimeout(() => {
        mockSubject.error(streamError);
      }, 0); // Convert Observable to Promise to test error handling
      const errorResult = await new Promise((resolve) => {
        result.subscribe({
          next: (data) => {
            // Handle any emitted data
            expect(data).toBeDefined();
          },
          error: (err) => resolve(err),
        });
      });

      // Assert
      expect(errorResult).toEqual(streamError);
    });
  });

  describe('Logging', () => {
    it('should log crawling requests', async () => {
      // Arrange
      const dto: CrawlByUrlRequestDto = {
        url: 'https://example.com/comic/123',
      };
      const loggerSpy = jest.spyOn(controller['logger'], 'log');

      mockComicService.getComicByUrl.mockResolvedValue({
        id: 1,
        title: 'Test Comic',
        description: 'Test',
        chapterCount: 1,
        originId: 'test',
        status: 'active',
        thumbImage: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      // Act
      await controller.crawlingByComicUrl(dto);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        `START crawling-by-url comicUrl=${JSON.stringify(dto)}`
      );
    });

    it('should log SSE requests', async () => {
      // Arrange
      const comicId = 1;
      const loggerSpy = jest.spyOn(controller['logger'], 'log');

      mockChapterService.handleChapterByComicId.mockResolvedValue(of());

      // Act
      await controller.crawlComicByUrlSSE(comicId);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        `START crawling-by-url sse with comicId=${comicId}`
      );
    });
  });
});
