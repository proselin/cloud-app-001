/**
 * Entity interface types for avoiding circular dependencies in TypeORM relations
 */

import { CommonEntityPlainObject } from '../../models/types/common-entity-plain-object';
import { ImagePlainObject } from '../../models/types/image-plain-object';

/**
 * Interface representing ComicEntity structure for type safety in relations
 */
export interface IComicEntity extends CommonEntityPlainObject {
  title: string;
  chapterCount: number;
  originId: string;
  status: string;
  description: string;
  originUrl: string;
  shouldRefresh: boolean;
  tags: string;
  author: string;
  crawlStatus: string;
  chapters: IChapterEntity[] | Promise<IChapterEntity[]>;
  thumbImage?: any;
}

/**
 * Interface representing ChapterEntity structure for type safety in relations
 */
export interface IChapterEntity extends CommonEntityPlainObject {
  chapterNumber: string;
  sourceUrl: string;
  title: string;
  position: number;
  crawlStatus: string;
  comic: IComicEntity;
  images: any[] | Promise<any[]>;
}
