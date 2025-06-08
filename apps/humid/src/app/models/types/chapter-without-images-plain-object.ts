import { CommonEntityPlainObject } from './common-entity-plain-object';

export type ChapterWithoutImagesPlainObject = CommonEntityPlainObject & {
  chapterNumber: string;
  sourceUrl: string;
  title: string;
  position: number;
  crawlStatus: string;
};
