/**
 * Comic models for API responses
 */

import { CommonEntityPlainObject, ImagePlainObject } from "./response-mapper.model";



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

// Backend SuggestComicDto response interface
export interface SuggestComic {
  id: number;
  title: string;
  url: string;
  chapter: string;
  author: string;
  genres: string[];
  thumbnail: string;
}

export interface ComicSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  status?: string;
  author?: string;
}
