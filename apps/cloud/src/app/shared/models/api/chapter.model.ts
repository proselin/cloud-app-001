/**
 * Chapter models for API responses
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

// Chapter structure from backend (with images)
export interface ChapterPlainObject extends CommonEntityPlainObject {
  chapterNumber: string;
  sourceUrl: string;
  title: string;
  position: number;
  crawlStatus: string;
  images: ImagePlainObject[];
}

export interface ChapterNavigationResponseDto {
  id: number;
  title: string;
  position: number;
}

export interface MinimizeChapterResponseDto extends CommonEntityPlainObject {
  chapterNumber: string;
  sourceUrl: string;
  title: string;
  position: number;
  crawlStatus: string;
}
