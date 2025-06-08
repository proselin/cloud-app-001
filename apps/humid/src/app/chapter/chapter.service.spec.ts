import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { ChapterEntity } from '../entities/chapter.entity';
import { CrawlingStatus } from '../common';

describe('ChapterService', () => {
  let service: ChapterService;

  const mockChapterRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockChapter = {
    id: 1,
    chapterNumber: '1',
    title: 'Chapter 1',
    sourceUrl: 'https://example.com/chapter/1',
    position: 1,
    crawlStatus: CrawlingStatus.READY_FOR_CRAWL,
    createdAt: new Date(),
    updatedAt: new Date(),
    comic: {
      id: 1,
      title: 'Test Comic',
      originId: 'test-comic-1',
      chapterCount: 10,
      status: 'active',
      description: 'Test description',
      originUrl: 'https://example.com/comic/1',
      shouldRefresh: false,
      tags: 'action,adventure',
      author: 'Test Author',
      crawlStatus: CrawlingStatus.READY_FOR_CRAWL,
      createdAt: new Date(),
      updatedAt: new Date(),
      chapters: [],
      thumbImage: null,
    },
    images: [
      {
        id: 1,
        filePath: '/path/to/image1.jpg',
        fileName: 'image1.jpg',
        fileExtension: 'jpg',
        sizeInBytes: 1024,
        position: 1,
        originUrl: 'https://example.com/image1.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
        chapter: null,
        comic: null,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChapterService,
        {
          provide: getRepositoryToken(ChapterEntity),
          useValue: mockChapterRepository,
        },
      ],
    }).compile();
    service = module.get<ChapterService>(ChapterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('getDetail', () => {
    it('should return chapter details when chapter exists', async () => {
      // Arrange
      const chapterId = 1;
      mockChapterRepository.findOne.mockResolvedValue(mockChapter);

      // Mock the expected result
      const expectedResult = await ChapterEntity.toJSON(
        mockChapter as unknown as ChapterEntity
      );

      // Act
      const result = await service.getDetail(chapterId);

      // Assert
      expect(mockChapterRepository.findOne).toHaveBeenCalledWith({
        where: { id: chapterId },
        relations: ['images'],
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when chapter does not exist', async () => {
      // Arrange
      const chapterId = 999;
      mockChapterRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getDetail(chapterId)).rejects.toThrow(
        new NotFoundException(`Chapter with id ${chapterId} not found`)
      );
      expect(mockChapterRepository.findOne).toHaveBeenCalledWith({
        where: { id: chapterId },
        relations: ['images'],
      });
    });
  });
  describe('getChaptersForNavigation', () => {
    it('should return chapters for navigation when comic has chapters', async () => {
      // Arrange
      const comicId = 1;
      const mockChapters = [
        { ...mockChapter, id: 1, chapterNumber: '1', position: 1 },
        { ...mockChapter, id: 2, chapterNumber: '2', position: 2 },
      ];
      mockChapterRepository.find.mockResolvedValue(mockChapters);

      // Act
      const result = await service.getChaptersForNavigation(comicId);

      // Assert
      expect(mockChapterRepository.find).toHaveBeenCalledWith({
        where: { comic: { id: comicId } },
        order: { position: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        title: 'Chapter 1',
        position: 1,
      });
    });

    it('should throw NotFoundException when comic has no chapters', async () => {
      // Arrange
      const comicId = 999;
      mockChapterRepository.find.mockResolvedValue([]);

      // Act & Assert
      await expect(service.getChaptersForNavigation(comicId)).rejects.toThrow(
        new NotFoundException(`No chapters found for comic id ${comicId}`)
      );
      expect(mockChapterRepository.find).toHaveBeenCalledWith({
        where: { comic: { id: comicId } },
        order: { position: 'ASC' },
      });
    });
  });
  describe('getChaptersByComicId', () => {
    it('should return minimized chapters when comic has chapters', async () => {
      // Arrange
      const comicId = 1;
      const mockChapters = [
        { ...mockChapter, id: 1, chapterNumber: '1' },
        { ...mockChapter, id: 2, chapterNumber: '2' },
      ];
      mockChapterRepository.find.mockResolvedValue(mockChapters);

      // Act
      const result = await service.getChaptersByComicId(comicId);

      // Assert
      expect(mockChapterRepository.find).toHaveBeenCalledWith({
        where: { comic: { id: comicId }, crawlStatus: CrawlingStatus.DONE },
        order: { position: 'ASC' },
      });
      expect(result).toHaveLength(2);
      // The actual result will be from ChapterEntity.toJSONWithoutImage
      expect(result[0]).toBeDefined();
      expect(result[0].id).toEqual(1);
      expect(result[0].chapterNumber).toEqual('1');
      expect(result[0].title).toEqual('Chapter 1');
      expect(result[0].crawlStatus).toEqual(CrawlingStatus.READY_FOR_CRAWL);
    });

    it('should return empty array when comic has no chapters', async () => {
      // Arrange
      const comicId = 999;
      mockChapterRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getChaptersByComicId(comicId);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
