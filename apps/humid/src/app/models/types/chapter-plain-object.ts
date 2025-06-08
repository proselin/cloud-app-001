import { CommonEntityPlainObject } from './common-entity-plain-object';
import { ImagePlainObject } from './image-plain-object';

export type ChapterPlainObject = CommonEntityPlainObject & {
  chapterNumber: string;
  sourceUrl: string;
  title: string;
  position: number;
  crawlStatus: string;
  images: ImagePlainObject[];
};
