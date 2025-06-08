import { Test, TestingModule } from '@nestjs/testing';
import { NettruyenComicService } from './nettruyen-comic.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ComicEntity } from '../../entities/comic.entity';
import { DataSource, QueryRunner } from 'typeorm';
import { NettruyenHttpService } from '../../http/nettruyen-http.service';
import { NettruyenImageService } from './nettruyen-image.service';
import { NettruyenChapterService } from './nettruyen-chapter.service';
import { COMIC_NOT_FOUND_BY_URL } from '../../exceptions/exceptions';

describe('NettruyenComicService', () => {
  let service: NettruyenComicService;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  const mockComicRepository = {
    findOneBy: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  const mockNettruyenHttpService = {
    get: jest.fn(),
    suggestSearch: jest.fn(),
    getChapterList: jest.fn(),
  };

  const mockImageService = {
    handleCrawlThumb: jest.fn(),
  };

  const mockChapterService = {
    handleCrawlChapter: jest.fn(),
  };
  const mockEntityManager = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    // Setup mock query runner with all necessary methods
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: mockEntityManager,
    } as unknown as jest.Mocked<QueryRunner>; // Reset the mock implementation for each test
    mockEntityManager.save.mockImplementation(
      (
        entityClass: unknown,
        entity: Record<string, unknown> | Record<string, unknown>[]
      ) => {
        if (Array.isArray(entity)) {
          return Promise.resolve(
            entity.map((e: Record<string, unknown>, index: number) => ({
              ...e,
              id: index + 1,
            }))
          );
        }
        return Promise.resolve({ ...entity, id: 1 });
      }
    );

    mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NettruyenComicService,
        {
          provide: getRepositoryToken(ComicEntity),
          useValue: mockComicRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: NettruyenHttpService,
          useValue: mockNettruyenHttpService,
        },
        {
          provide: NettruyenImageService,
          useValue: mockImageService,
        },
        {
          provide: NettruyenChapterService,
          useValue: mockChapterService,
        },
      ],
    }).compile();

    service = module.get<NettruyenComicService>(NettruyenComicService);
  });
  afterEach(() => {
    jest.clearAllMocks();
    // Reset entity manager mock implementation
    mockEntityManager.save.mockImplementation(
      (
        entityClass: unknown,
        entity: Record<string, unknown> | Record<string, unknown>[]
      ) => {
        if (Array.isArray(entity)) {
          return Promise.resolve(
            entity.map((e: Record<string, unknown>, index: number) => ({
              ...e,
              id: index + 1,
            }))
          );
        }
        return Promise.resolve({ ...entity, id: 1 });
      }
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getComicByUrl', () => {
    it('should return existing comic when found by URL', async () => {
      // Arrange
      const url = 'https://nettruyenrr.com/truyen-tranh/test-comic';
      const mockThumbImage = {
        id: 1,
        fileName: 'test-thumb.jpg',
        position: 0,
        type: 0,
        originUrls: '["https://example.com/thumb.jpg"]',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockComic = {
        id: 1,
        title: 'Test Comic',
        originUrl: url,
        description: 'Test Description',
        chapterCount: 5,
        originId: 'test-123',
        status: 'ongoing',
        thumbImage: mockThumbImage,
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockComicRepository.findOneBy.mockResolvedValue(mockComic);

      // Act
      const result = await service.getComicByUrl(url);

      // Assert
      expect(mockComicRepository.findOneBy).toHaveBeenCalledWith({
        originUrl: url,
      });
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Comic');
    });
    it('should create new comic when not found by URL - triggers private methods pullNewComic, extractInfo', async () => {
      // Arrange
      const url = 'https://nettruyenrr.com/truyen-tranh/new-comic';

      const mockThumbImage = {
        id: 1,
        fileName: 'thumb.jpg',
        position: 0,
        type: 0,
        originUrls: '["https://example.com/thumb.jpg"]',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock HTTP response for extraction (extractInfo method) with correct HTML structure
      mockNettruyenHttpService.get.mockResolvedValue({
        data: `
          <html>
            <head>
              <script>
                var gOpts = {};
                gOpts.comicId = "comic-123";
                gOpts.comicSlug = "new-comic";
                gOpts.comicName = "New Comic Title";
              </script>
            </head>
            <body>
              <div class="detail-content">
                <div class="detail-content-image">
                  <img data-src="https://example.com/thumb.jpg" />
                </div>
              </div>
            </body>
          </html>
        `,
      });

      // Mock chapter list API response
      mockNettruyenHttpService.getChapterList.mockResolvedValue({
        data: {
          data: [
            { chapter_num: 1, chapter_slug: 'chap-1' },
            { chapter_num: 2, chapter_slug: 'chap-2' },
          ],
        },
      });

      // No existing comic found by URL or originId (triggers getComicOrCrawlNew -> extractInfo -> pullNewComic)
      mockComicRepository.findOneBy
        .mockResolvedValueOnce(null) // First call for originUrl
        .mockResolvedValueOnce(null); // Second call for originId

      // Mock image service
      mockImageService.handleCrawlThumb.mockResolvedValue(mockThumbImage);

      // Act
      const result = await service.getComicByUrl(url);

      // Assert
      expect(mockComicRepository.findOneBy).toHaveBeenCalledWith({
        originUrl: url,
      });
      expect(mockComicRepository.findOneBy).toHaveBeenCalledWith({
        originId: 'comic-123',
      });
      expect(mockNettruyenHttpService.get).toHaveBeenCalledWith(url);
      expect(mockNettruyenHttpService.getChapterList).toHaveBeenCalledWith(
        'https://nettruyenrr.com',
        'new-comic',
        'comic-123'
      );
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockEntityManager.save).toHaveBeenCalled();
      expect(mockImageService.handleCrawlThumb).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle extraction failure and throw COMIC_NOT_FOUND_BY_URL error', async () => {
      // Arrange
      const url = 'https://nettruyenrr.com/truyen-tranh/invalid-comic';

      // No existing comic found by URL
      mockComicRepository.findOneBy.mockResolvedValue(null);

      // Mock HTTP service to fail extraction
      mockNettruyenHttpService.get.mockRejectedValue(
        new Error('Network error')
      );

      // Act & Assert
      await expect(service.getComicByUrl(url)).rejects.toThrow(
        COMIC_NOT_FOUND_BY_URL
      );
    });

    it('should handle transaction rollback on error during comic creation', async () => {
      // Arrange
      const url = 'https://nettruyenrr.com/truyen-tranh/error-comic'; // Mock HTTP response for extraction with correct HTML structure
      mockNettruyenHttpService.get.mockResolvedValue({
        data: `
          <html>
            <head>
              <script>
                var gOpts = {};
                gOpts.comicId = "comic-456";
                gOpts.comicSlug = "error-comic";
                gOpts.comicName = "Error Comic Title";
              </script>
            </head>
            <body>
              <div class="detail-content">
                <div class="detail-content-image">
                  <img data-src="https://example.com/thumb.jpg" />
                </div>
              </div>
            </body>
          </html>
        `,
      });

      // Mock chapter list API response
      mockNettruyenHttpService.getChapterList.mockResolvedValue({
        data: {
          data: [{ chapter_num: 1, chapter_slug: 'chap-1' }],
        },
      }); // No existing comic found
      mockComicRepository.findOneBy
        .mockResolvedValueOnce(null) // originUrl
        .mockResolvedValueOnce(null); // originId

      // Mock save to fail during comic creation
      mockEntityManager.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getComicByUrl(url)).rejects.toThrow(
        'Database error'
      );
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should find existing comic by originId when originUrl lookup fails', async () => {
      // Arrange
      const url = 'https://nettruyenrr.com/truyen-tranh/existing-comic';
      const mockExistingComic = {
        id: 2,
        title: 'Existing Comic',
        originId: 'comic-789',
        originUrl: 'https://old-url.com/comic',
        description: 'Existing Description',
        chapterCount: 3,
        status: 'completed',
        thumbImage: {
          id: 2,
          fileName: 'existing-thumb.jpg',
          position: 0,
          type: 0,
          originUrls: '["https://example.com/existing-thumb.jpg"]',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }; // Mock HTTP response for extraction with correct HTML structure
      mockNettruyenHttpService.get.mockResolvedValue({
        data: `
          <html>
            <head>
              <script>
                var gOpts = {};
                gOpts.comicId = "comic-789";
                gOpts.comicSlug = "existing-comic";
                gOpts.comicName = "Existing Comic Title";
              </script>
            </head>
            <body>
              <div class="detail-content">
                <div class="detail-content-image">
                  <img data-src="https://example.com/thumb.jpg" />
                </div>
              </div>
            </body>
          </html>
        `,
      });

      // Mock chapter list API response
      mockNettruyenHttpService.getChapterList.mockResolvedValue({
        data: {
          data: [
            { chapter_num: 1, chapter_slug: 'chap-1' },
            { chapter_num: 2, chapter_slug: 'chap-2' },
            { chapter_num: 3, chapter_slug: 'chap-3' },
          ],
        },
      });

      // No comic found by URL, but found by originId
      mockComicRepository.findOneBy
        .mockResolvedValueOnce(null) // originUrl
        .mockResolvedValueOnce(mockExistingComic); // originId

      // Act
      const result = await service.getComicByUrl(url);

      // Assert
      expect(mockComicRepository.findOneBy).toHaveBeenCalledWith({
        originUrl: url,
      });
      expect(mockComicRepository.findOneBy).toHaveBeenCalledWith({
        originId: 'comic-789',
      });
      expect(mockNettruyenHttpService.get).toHaveBeenCalledWith(url);
      expect(result).toBeDefined();
      expect(result.title).toBe('Existing Comic');
      // Should not start transaction since comic already exists
      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
    });
  });
});
