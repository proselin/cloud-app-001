/**
 * Chapter models for API responses
 */

import { CommonEntityPlainObject, ImagePlainObject } from "./response-mapper.model";
// Chapter structure from backend (with images)
export interface ChapterPlainObject extends CommonEntityPlainObject {
  chapterNumber: string;
  sourceUrl: string;
  title: string;
  position: number;
  crawlStatus: string;
  images: ImagePlainObject[];
  comic: {
    id: number;
    title: string;
  };
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

export interface ChapterShortInfo   extends CommonEntityPlainObject {
     id: number
  updatedAt: string
  createdAt: string
  chapterNumber: string
  sourceUrl: string
  title: string
  position: number
  crawlStatus: string
  isCrawled?: boolean;
}
