import { Test, TestingModule } from '@nestjs/testing';
import { NettruyenImageService } from './nettruyen-image.service';
import { CrawlingQueueService } from './crawling-queue.service';
import { ImageType } from '../../common/constant/image';
import { FileIoService } from '../../file-io/file-io.service';
import { NettruyenHttpService } from '../../http/nettruyen-http.service';
import { QueryRunner } from 'typeorm';
import { ImageEntity } from '../../entities/image.entity';

describe('NettruyenImageService', () => {
  let service: NettruyenImageService;
  let fileIoService: FileIoService;
  let nettruyenHttpService: NettruyenHttpService;
  let crawlingQueueService: CrawlingQueueService;

  const mockFileIoService = {
    generateFileName: jest.fn().mockReturnValue('generated-file-name.jpg'),
    saveImageFile: jest.fn().mockResolvedValue(undefined),
  };

  const mockNettruyenHttpService = {
    get: jest.fn(),
    getImages: jest.fn().mockResolvedValue({
      data: Buffer.from('mock-image-data'),
      headers: { 'content-type': 'image/jpeg' }
    }),
  };

  const mockCrawlingQueueService = {
    queueImageTask: jest.fn().mockImplementation(({ execute }) => execute()),
    queueChapterTask: jest.fn(),
    getQueueStatus: jest.fn(),
    isImageQueueBusy: jest.fn(),
    isChapterQueueBusy: jest.fn(),
  };

  // Mock query runner for transaction tests
  const mockQueryRunner = {
    manager: {
      save: jest.fn().mockImplementation((entity, entityData) => entityData),
    },
  } as unknown as QueryRunner;

  // Mock ImageEntity static methods
  const mockImageEntity = {
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset all mocks to default behavior
    mockNettruyenHttpService.getImages.mockResolvedValue({
      data: Buffer.from('mock-image-data'),
      headers: { 'content-type': 'image/jpeg' }
    });
    mockFileIoService.saveImageFile.mockResolvedValue(undefined);
    mockCrawlingQueueService.queueImageTask.mockImplementation(({ execute }) => execute());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NettruyenImageService,
        {
          provide: FileIoService,
          useValue: mockFileIoService,
        },
        {
          provide: NettruyenHttpService,
          useValue: mockNettruyenHttpService,
        },
        {
          provide: CrawlingQueueService,
          useValue: mockCrawlingQueueService,
        },
      ],
    }).compile();

    service = module.get<NettruyenImageService>(NettruyenImageService);
    fileIoService = module.get<FileIoService>(FileIoService);
    nettruyenHttpService = module.get<NettruyenHttpService>(NettruyenHttpService);
    crawlingQueueService = module.get<CrawlingQueueService>(CrawlingQueueService);

    // Mock ImageEntity constructor and save method
    jest.spyOn(ImageEntity.prototype, 'save').mockImplementation(mockImageEntity.save);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleCrawlThumb', () => {
    it('should handle crawling a thumbnail image successfully', async () => {
      // Mock data
      const imageData = {
        comicId: 1,
        type: ImageType.THUMB,
        domain: 'example.com',
        dataUrls: ['https://example.com/thumb.jpg'],
        position: 0,
      };

      // Call the method
      const result = await service.handleCrawlThumb(imageData, mockQueryRunner);

      // Assertions
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(ImageEntity);
      expect(nettruyenHttpService.getImages).toHaveBeenCalledWith(
        'https://example.com/thumb.jpg',
        'example.com'
      );
      expect(fileIoService.generateFileName).toHaveBeenCalled();
      expect(fileIoService.saveImageFile).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    });

    it('should handle errors when thumbnail crawling fails', async () => {
      // Mock data
      const imageData = {
        comicId: 1,
        type: ImageType.THUMB,
        domain: 'example.com',
        dataUrls: ['https://example.com/thumb.jpg'],
        position: 0,
      };

      // Mock network error - getImages should return null (no response)
      mockNettruyenHttpService.getImages.mockResolvedValue(null);

      // Call the method and expect it to throw (should throw "Not result found")
      await expect(
        service.handleCrawlThumb(imageData, mockQueryRunner)
      ).rejects.toThrow('Not result found');
    });

    it('should handle empty dataUrls array', async () => {
      const imageData = {
        comicId: 1,
        type: ImageType.THUMB,
        domain: 'example.com',
        dataUrls: [],
        position: 0,
      };

      // Call the method and expect it to throw for empty URLs
      await expect(
        service.handleCrawlThumb(imageData, mockQueryRunner)
      ).rejects.toThrow('Not result found');
    });
  });

  describe('handleCrawlImages', () => {
    it('should handle crawling multiple chapter images successfully', async () => {
      // Mock data - array of image data objects
      const imagesData = [
        {
          chapterId: 1,
          comicId: 1,
          type: ImageType.CHAPTER_IMAGE,
          domain: 'example.com',
          dataUrls: ['https://example.com/page1.jpg'],
          position: 0,
        },
        {
          chapterId: 1,
          comicId: 1,
          type: ImageType.CHAPTER_IMAGE,
          domain: 'example.com',
          dataUrls: ['https://example.com/page2.jpg'],
          position: 1,
        },
      ];

      // Call the method
      const result = await service.handleCrawlImages(imagesData, mockQueryRunner);

      // Assertions
      expect(result).toHaveLength(2);
      expect(crawlingQueueService.queueImageTask).toHaveBeenCalledTimes(2);
      expect(nettruyenHttpService.getImages).toHaveBeenCalledTimes(2);
      expect(fileIoService.generateFileName).toHaveBeenCalledTimes(2);
      expect(fileIoService.saveImageFile).toHaveBeenCalledTimes(2);

      // Check that all results are ImageEntity instances
      result.forEach(image => {
        expect(image).toBeInstanceOf(ImageEntity);
      });
    });

    it('should handle errors gracefully and filter out failed images', async () => {
      const imagesData = [
        {
          chapterId: 1,
          comicId: 1,
          type: ImageType.CHAPTER_IMAGE,
          domain: 'example.com',
          dataUrls: ['https://example.com/valid-page.jpg'],
          position: 0,
        },
        {
          chapterId: 1,
          comicId: 1,
          type: ImageType.CHAPTER_IMAGE,
          domain: 'example.com',
          dataUrls: ['https://example.com/invalid-page.jpg'],
          position: 1,
        },
      ];

      // Mock one success and one failure
      mockNettruyenHttpService.getImages
        .mockResolvedValueOnce({
          data: Buffer.from('valid-image-data'),
          headers: { 'content-type': 'image/jpeg' }
        })
        .mockRejectedValueOnce(new Error('Image download failed'));

      const result = await service.handleCrawlImages(imagesData, mockQueryRunner);

      // Should return only the successful image (filtered out undefined)
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ImageEntity);
    });

    it('should handle empty images array', async () => {
      const result = await service.handleCrawlImages([], mockQueryRunner);
      expect(result).toHaveLength(0);
      expect(crawlingQueueService.queueImageTask).not.toHaveBeenCalled();
    });

    it('should handle images with multiple fallback URLs', async () => {
      const imagesData = [
        {
          chapterId: 1,
          comicId: 1,
          type: ImageType.CHAPTER_IMAGE,
          domain: 'example.com',
          dataUrls: [
            'https://example.com/invalid1.jpg',
            'https://example.com/invalid2.jpg',
            'https://example.com/valid.jpg'
          ],
          position: 0,
        },
      ];

      // Mock first two URLs to fail, third to succeed
      mockNettruyenHttpService.getImages
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          data: Buffer.from('valid-image-data'),
          headers: { 'content-type': 'image/jpeg' }
        });

      const result = await service.handleCrawlImages(imagesData, mockQueryRunner);

      expect(result).toHaveLength(1);
      expect(nettruyenHttpService.getImages).toHaveBeenCalledTimes(3);
      expect(result[0]).toBeInstanceOf(ImageEntity);
    });

    it('should handle queue service errors', async () => {
      const imagesData = [
        {
          chapterId: 1,
          comicId: 1,
          type: ImageType.CHAPTER_IMAGE,
          domain: 'example.com',
          dataUrls: ['https://example.com/page.jpg'],
          position: 0,
        },
      ];

      // Mock queue service to throw error
      mockCrawlingQueueService.queueImageTask.mockRejectedValue(new Error('Queue error'));

      const result = await service.handleCrawlImages(imagesData, mockQueryRunner);

      // Should handle error gracefully and return filtered results
      expect(result).toHaveLength(0);
    });
  });

  describe('private method integration', () => {
    it('should create image entity with correct properties', async () => {
      const imageData = {
        comicId: 1,
        type: ImageType.THUMB,
        domain: 'example.com',
        dataUrls: ['https://example.com/thumb.jpg'],
        position: 0,
      };

      const result = await service.handleCrawlThumb(imageData, mockQueryRunner);

      expect(result).toBeDefined();
      expect(result.fileName).toBe('generated-file-name.jpg');
      expect(result.position).toBe(0);
      expect(result.type).toBe(ImageType.THUMB);
      expect(result.originUrls).toBe(JSON.stringify(['https://example.com/thumb.jpg']));
    });

    it('should handle different image types correctly', async () => {
      const thumbData = {
        comicId: 1,
        type: ImageType.THUMB,
        domain: 'example.com',
        dataUrls: ['https://example.com/thumb.jpg'],
        position: 0,
      };

      const chapterImageData = {
        chapterId: 1,
        comicId: 1,
        type: ImageType.CHAPTER_IMAGE,
        domain: 'example.com',
        dataUrls: ['https://example.com/page.jpg'],
        position: 0,
      };

      const thumbResult = await service.handleCrawlThumb(thumbData, mockQueryRunner);
      const chapterResult = await service.handleCrawlImages([chapterImageData], mockQueryRunner);

      expect(thumbResult.type).toBe(ImageType.THUMB);
      expect(chapterResult[0].type).toBe(ImageType.CHAPTER_IMAGE);
    });
  });

  describe('error handling', () => {
    it('should handle file save errors', async () => {
      const imageData = {
        comicId: 1,
        type: ImageType.THUMB,
        domain: 'example.com',
        dataUrls: ['https://example.com/thumb.jpg'],
        position: 0,
      };

      mockFileIoService.saveImageFile.mockRejectedValue(new Error('File save error'));

      await expect(
        service.handleCrawlThumb(imageData, mockQueryRunner)
      ).rejects.toThrow('File save error');
    });

    it('should handle database save errors', async () => {
      const imageData = {
        comicId: 1,
        type: ImageType.THUMB,
        domain: 'example.com',
        dataUrls: ['https://example.com/thumb.jpg'],
        position: 0,
      };

      const mockQueryRunnerWithError = {
        manager: {
          save: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      } as unknown as QueryRunner;

      await expect(
        service.handleCrawlThumb(imageData, mockQueryRunnerWithError)
      ).rejects.toThrow('Database error');
    });

    it('should handle invalid content type', async () => {
      const imageData = {
        comicId: 1,
        type: ImageType.THUMB,
        domain: 'example.com',
        dataUrls: ['https://example.com/invalid.txt'],
        position: 0,
      };

      mockNettruyenHttpService.getImages.mockResolvedValue({
        data: Buffer.from('not-an-image'),
        headers: { 'content-type': 'text/plain' }
      });

      // Should still work as service doesn't validate content type
      const result = await service.handleCrawlThumb(imageData, mockQueryRunner);
      expect(result).toBeDefined();
    });
  });
});
