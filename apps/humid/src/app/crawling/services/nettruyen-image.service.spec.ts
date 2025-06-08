import { Test, TestingModule } from '@nestjs/testing';
import { NettruyenImageService } from './nettruyen-image.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ImageEntity } from '../../entities/image.entity';
import { ImageType } from '../../common/constant/image';
import { FileIoService } from '../../file-io/file-io.service';
import { NettruyenHttpService } from '../../http/nettruyen-http.service';
import { QueryRunner } from 'typeorm';

describe('NettruyenImageService', () => {
  let service: NettruyenImageService;
  let crawlAndSaveImageSpy: jest.SpyInstance;
  let createImageSpy: jest.SpyInstance;

  const mockImageRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockFileIoService = {
    generateFileName: jest.fn().mockReturnValue('generated-file-name.jpg'),
    saveImageFile: jest.fn().mockResolvedValue(undefined),
  };

  const mockNettruyenHttpService = {
    get: jest.fn(),
    getImages: jest.fn(),
  };  // Mock query runner for transaction tests
  const mockQueryRunner = {
    manager: {
      save: jest.fn().mockImplementation(entity => entity),
    },
  } as unknown as QueryRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NettruyenImageService,
        {
          provide: getRepositoryToken(ImageEntity),
          useValue: mockImageRepository,
        },
        {
          provide: FileIoService,
          useValue: mockFileIoService,
        },
        {
          provide: NettruyenHttpService,
          useValue: mockNettruyenHttpService,
        },
      ],
    }).compile();    service = module.get<NettruyenImageService>(NettruyenImageService);

    // Set up spies for private methods using proper typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    crawlAndSaveImageSpy = jest.spyOn(service as any, 'crawlAndSaveImage');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createImageSpy = jest.spyOn(service as any, 'createImage');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleCrawlThumb', () => {
    it('should handle crawling a thumbnail image', async () => {
      // Mock data
      const imageData = {
        comicId: 1,
        type: ImageType.THUMB,
        domain: 'example.com',
        dataUrls: ['https://example.com/thumb.jpg'],
        position: 0,
      };

      // Mock private method implementations
      crawlAndSaveImageSpy.mockResolvedValue('thumb-1-123.jpg');
      createImageSpy.mockResolvedValue({
        id: 1,
        fileName: 'thumb-1-123.jpg',
        type: ImageType.THUMB,
        position: 0,
      });      // Call the method
      const result = await service.handleCrawlThumb(imageData, mockQueryRunner);

      // Assertions
      expect(result).toBeDefined();
      expect(result.id).toEqual(1);
      expect(result.type).toEqual(ImageType.THUMB);
      expect(crawlAndSaveImageSpy).toHaveBeenCalledWith(
        `thumb-${imageData.comicId}`,
        imageData.dataUrls,
        imageData.domain
      );
      expect(createImageSpy).toHaveBeenCalled();
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

      // Mock crawl to throw error
      crawlAndSaveImageSpy.mockRejectedValue(new Error('Crawl failed'));      // Call the method and expect it to throw
      await expect(service.handleCrawlThumb(imageData, mockQueryRunner)).rejects.toThrow('Crawl failed');
    });
  });

  describe('handleCrawlImages', () => {
    it('should handle crawling multiple chapter images', async () => {
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
        }
      ];

      // Mock private method implementations
      crawlAndSaveImageSpy
        .mockResolvedValueOnce('page1.jpg')
        .mockResolvedValueOnce('page2.jpg');

      createImageSpy
        .mockResolvedValueOnce({
          id: 1,
          fileName: 'page1.jpg',
          type: ImageType.CHAPTER_IMAGE,
          position: 0,
        })
        .mockResolvedValueOnce({
          id: 2,
          fileName: 'page2.jpg',
          type: ImageType.CHAPTER_IMAGE,
          position: 1,
        });      // Call the method with array
      const result = await service.handleCrawlImages(imagesData, mockQueryRunner);

      // Assertions - filter out undefined results
      const validResults = result.filter(item => !!item);
      expect(validResults).toHaveLength(2);
      expect(crawlAndSaveImageSpy).toHaveBeenCalledTimes(2);
      expect(validResults[0]?.position).toEqual(0);
      expect(validResults[1]?.position).toEqual(1);
      expect(createImageSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle empty URL arrays', async () => {
      // Mock data with empty URLs
      const imagesData = [
        {
          chapterId: 1,
          comicId: 1,
          type: ImageType.CHAPTER_IMAGE,
          domain: 'example.com',
          dataUrls: [],
          position: 0,
        }
      ];

      // Mock crawl to throw error for empty URLs
      crawlAndSaveImageSpy.mockRejectedValue(new Error('No URLs provided'));      // Call the method
      const result = await service.handleCrawlImages(imagesData, mockQueryRunner);

      // Assertions - result may contain undefined due to error handling
      expect(result).toHaveLength(1);
      expect(result[0]).toBeUndefined(); // Error should be caught and return undefined
    });
  });
});
