/**
 * Comic models for API responses
 */

// Base entity structure from backend
export interface CommonEntityPlainObject {
  id: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Image structure from backend
export interface ImagePlainObject extends CommonEntityPlainObject {
  fileName: string;
  originUrls: string;
  position: number;
  type: number;
}

// Chapter structure from backend (without images)
export interface ChapterWithoutImagesPlainObject extends CommonEntityPlainObject {
  chapterNumber: string;
  sourceUrl: string;
  title: string;
  position: number;
  crawlStatus: string;
}

// Main comic structure from backend
export interface ComicPlainObject extends CommonEntityPlainObject {
  title: string;
  description: string;
  chapterCount: number;
  originId: string;
  status: string;
  chapters: ChapterWithoutImagesPlainObject[];
  thumbImage: ImagePlainObject | null;
}

export interface ComicSuggestionResponseDto {
  id: string;
  title: string;
  thumbnailUrl: string;
  author: string;
  status: string;
}

export interface ComicSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  status?: string;
  author?: string;
}
