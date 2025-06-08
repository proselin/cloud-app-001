import { ComicEntity } from './comic.entity';
import { CrawlingStatus } from '../common/constant/queue';

// Types for mock objects
interface MockImageEntity {
  id: number;
  fileName: string;
  filePath: string;
  originUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockChapterEntity {
  id: number;
  chapterNumber: string;
  title: string;
  chapterName: string;
  originUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockComicEntity {
  id: number;
  title: string;
  description: string;
  chapterCount: number;
  originId: string;
  status: string;
  originUrl: string;
  shouldRefresh: boolean;
  tags: string;
  author: string;
  crawlStatus: CrawlingStatus;
  chapters: Promise<MockChapterEntity[]>;
  thumbImage: MockImageEntity;
  createdAt: Date;
  updatedAt: Date;
}

// Mock static methods for dependencies
jest.mock('../common/entity/common.entity', () => {
  // Create a mock base class
  class MockCommonEntity {
    id!: number;
    createdAt!: Date | string;
    updatedAt!: Date | string;

    static async toJSON(
      entity: MockComicEntity | MockChapterEntity | MockImageEntity
    ) {
      if (!entity) throw new Error('Entity is not common');
      return {
        id: entity.id,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      };
    }
  }

  return {
    CommonEntity: MockCommonEntity,
  };
});

jest.mock('./image.entity', () => ({
  ImageEntity: {
    toJSON: jest.fn((entity: MockImageEntity | null) => {
      if (!entity) return null;
      return {
        id: entity.id,
        fileName: entity.fileName,
        filePath: entity.filePath,
        originUrl: entity.originUrl,
      };
    }),
  },
}));

jest.mock('./chapter.entity', () => ({
  ChapterEntity: {
    toJSONWithoutImage: jest.fn((entity: MockChapterEntity) => ({
      id: entity.id,
      chapterNumber: entity.chapterNumber,
      chapterName: entity.title || entity.chapterName,
      originUrl: entity.originUrl,
    })),
  },
}));

describe('ComicEntity', () => {
  let mockImageEntity: MockImageEntity;
  let mockChapterEntity: MockChapterEntity;
  let mockComicEntity: MockComicEntity;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock ImageEntity
    mockImageEntity = {
      id: 1,
      fileName: 'thumb.jpg',
      filePath: '/images/thumb.jpg',
      originUrl: 'https://example.com/thumb.jpg',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    // Create mock ChapterEntity
    mockChapterEntity = {
      id: 1,
      chapterNumber: '1',
      title: 'Chapter 1',
      chapterName: 'Chapter 1',
      originUrl: 'https://example.com/chapter/1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    // Create mock ComicEntity
    mockComicEntity = {
      id: 1,
      title: 'Test Comic',
      description: 'A test comic description',
      chapterCount: 5,
      originId: 'comic-123',
      status: 'Ongoing',
      originUrl: 'https://example.com/comic/test',
      shouldRefresh: false,
      tags: 'action,adventure',
      author: 'Test Author',
      crawlStatus: CrawlingStatus.DONE,
      chapters: Promise.resolve([mockChapterEntity]),
      thumbImage: mockImageEntity,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('toJSONWithoutChapter', () => {
    it('should convert entity to JSON without chapters', async () => {
      const result = await ComicEntity.toJSONWithoutChapter(
        mockComicEntity as unknown as ComicEntity
      );

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('title', 'Test Comic');
      expect(result).toHaveProperty('description', 'A test comic description');
      expect(result).toHaveProperty('chapterCount', 5);
      expect(result).toHaveProperty('originId', 'comic-123');
      expect(result).toHaveProperty('status', 'Ongoing');
      expect(result).toHaveProperty('thumbImage');
      expect(result.thumbImage).toHaveProperty('id', 1);
      expect(result.thumbImage).toHaveProperty('fileName', 'thumb.jpg');

      // Should not include chapters
      expect(result).not.toHaveProperty('chapters');
    });

    it('should handle entity with null thumb image', async () => {
      const entityWithoutThumb = {
        ...mockComicEntity,
        thumbImage: null,
      };

      const result = await ComicEntity.toJSONWithoutChapter(
        entityWithoutThumb as unknown as ComicEntity
      );

      expect(result.thumbImage).toBeNull();
    });
    it('should handle entity with undefined title', async () => {
      const entityWithUndefinedTitle = {
        ...mockComicEntity,
        title: undefined as unknown as string,
      };

      const result = await ComicEntity.toJSONWithoutChapter(
        entityWithUndefinedTitle as unknown as ComicEntity
      );

      expect(result.title).toBeUndefined();
    });

    it('should handle entity with undefined description', async () => {
      const entityWithUndefinedDescription = {
        ...mockComicEntity,
        description: undefined as unknown as string,
      };

      const result = await ComicEntity.toJSONWithoutChapter(
        entityWithUndefinedDescription as unknown as ComicEntity
      );

      expect(result.description).toBeUndefined();
    });

    it('should handle entity with undefined status', async () => {
      const entityWithUndefinedStatus = {
        ...mockComicEntity,
        status: undefined as unknown as string,
      };

      const result = await ComicEntity.toJSONWithoutChapter(
        entityWithUndefinedStatus as unknown as ComicEntity
      );

      expect(result.status).toBeUndefined();
    });
  });
  describe('toJSON', () => {
    it('should convert entity to full JSON with chapters', async () => {
      const result = await ComicEntity.toJSON(
        mockComicEntity as unknown as ComicEntity
      );

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('title', 'Test Comic');
      expect(result).toHaveProperty('description', 'A test comic description');
      expect(result).toHaveProperty('chapterCount', 5);
      expect(result).toHaveProperty('originId', 'comic-123');
      expect(result).toHaveProperty('status', 'Ongoing');
      expect(result).toHaveProperty('thumbImage');
      expect(result.thumbImage).toHaveProperty('id', 1);
      expect(result.thumbImage).toHaveProperty('fileName', 'thumb.jpg');
      expect(result).toHaveProperty('chapters');
      expect(result.chapters).toHaveLength(1);
      expect(result.chapters[0]).toHaveProperty('id', 1);
      expect(result.chapters[0]).toHaveProperty('chapterNumber', '1');
      expect(result.chapters[0]).toHaveProperty('chapterName', 'Chapter 1');
    });

    it('should handle entity with multiple chapters', async () => {
      const secondChapter: MockChapterEntity = {
        ...mockChapterEntity,
        id: 2,
        chapterNumber: '2',
        title: 'Chapter 2',
      };

      const entityWithMultipleChapters = {
        ...mockComicEntity,
        chapters: Promise.resolve([mockChapterEntity, secondChapter]),
      };

      const result = await ComicEntity.toJSON(
        entityWithMultipleChapters as unknown as ComicEntity
      );

      expect(result.chapters).toHaveLength(2);
      expect(result.chapters[0]).toHaveProperty('id', 1);
      expect(result.chapters[1]).toHaveProperty('id', 2);
    });

    it('should handle entity with empty chapters array', async () => {
      const entityWithNoChapters = {
        ...mockComicEntity,
        chapters: Promise.resolve([]),
      };

      const result = await ComicEntity.toJSON(
        entityWithNoChapters as unknown as ComicEntity
      );

      expect(result.chapters).toEqual([]);
    });

    it('should handle entity with null thumb image', async () => {
      const entityWithoutThumb = {
        ...mockComicEntity,
        thumbImage: null,
      };

      const result = await ComicEntity.toJSON(
        entityWithoutThumb as unknown as ComicEntity
      );

      expect(result.thumbImage).toBeNull();
    });

    it('should handle entity with undefined title', async () => {
      const entityWithUndefinedProps = {
        ...mockComicEntity,
        title: undefined as unknown as string,
      };

      const result = await ComicEntity.toJSON(
        entityWithUndefinedProps as unknown as ComicEntity
      );

      expect(result.title).toBeUndefined();
    });

    it('should handle entity with undefined description', async () => {
      const entityWithUndefinedProps = {
        ...mockComicEntity,
        description: undefined as unknown as string,
      };

      const result = await ComicEntity.toJSON(
        entityWithUndefinedProps as unknown as ComicEntity
      );

      expect(result.description).toBeUndefined();
    });

    it('should handle entity with undefined status', async () => {
      const entityWithUndefinedProps = {
        ...mockComicEntity,
        status: undefined as unknown as string,
      };

      const result = await ComicEntity.toJSON(
        entityWithUndefinedProps as unknown as ComicEntity
      );

      expect(result.status).toBeUndefined();
    });
  });

  describe('Entity structure', () => {
    it('should have all required properties', () => {
      expect(mockComicEntity).toHaveProperty('id');
      expect(mockComicEntity).toHaveProperty('title');
      expect(mockComicEntity).toHaveProperty('description');
      expect(mockComicEntity).toHaveProperty('chapterCount');
      expect(mockComicEntity).toHaveProperty('originId');
      expect(mockComicEntity).toHaveProperty('status');
      expect(mockComicEntity).toHaveProperty('originUrl');
      expect(mockComicEntity).toHaveProperty('shouldRefresh');
      expect(mockComicEntity).toHaveProperty('tags');
      expect(mockComicEntity).toHaveProperty('author');
      expect(mockComicEntity).toHaveProperty('crawlStatus');
      expect(mockComicEntity).toHaveProperty('chapters');
      expect(mockComicEntity).toHaveProperty('thumbImage');
      expect(mockComicEntity).toHaveProperty('createdAt');
      expect(mockComicEntity).toHaveProperty('updatedAt');
    });

    it('should have correct data types', () => {
      expect(typeof mockComicEntity.id).toBe('number');
      expect(typeof mockComicEntity.title).toBe('string');
      expect(typeof mockComicEntity.chapterCount).toBe('number');
      expect(typeof mockComicEntity.shouldRefresh).toBe('boolean');
      expect(mockComicEntity.chapters).toBeInstanceOf(Promise);
    });
  });
});
