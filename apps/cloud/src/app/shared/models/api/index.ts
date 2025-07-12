/**
 * Barrel export for all API models
 */

import { ComicInfo } from '../types';
import { ChapterShortInfo } from './chapter.model';

export * from './response-mapper.model';
export * from './chapter.model';
export * from './comic.model';
export * from './crawl.model';


export type SearchComicRes = ComicInfo[];

export interface ChapterInfo {
  id: number;
  comicId: number;
  title: string;
  chapterNumber: string;
  position: number;
  isCrawled: boolean;
  imageCount: number;
  sourceUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComicDetailInfo extends ComicInfo {
  id: number;
  chapters: ChapterShortInfo[];
  status: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChapterDetailInfo extends ChapterInfo {
  images: ChapterImage[];
}

export interface ChapterImage {
  id: number;
  fileName: string;
  position: number;
  url: string;
}
