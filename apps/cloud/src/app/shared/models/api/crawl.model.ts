/**
 * Crawl models for API requests and responses
 */

export interface CrawlByUrlRequestDto {
  url: string;
}

export interface CrawlComicByUrlResponseDto {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  author: string;
  status: string;
  genres: string[];
  alternativeTitles: string[];
  chapters: Array<{
    id: string;
    title: string;
    url: string;
    chapterNumber: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrawlChapterProgressEvent {
  type: 'progress' | 'completed' | 'error';
  chapterId?: string;
  message?: string;
  progress?: number;
  data?: unknown;
}
