import { ImagePlainObject } from './image-plain-object';
import { ChapterWithoutImagesPlainObject } from './chapter-without-images-plain-object';
import { CommonEntityPlainObject } from './common-entity-plain-object';

export type ComicPlainObject = CommonEntityPlainObject & {
  title: string;
  description: string;
  chapterCount: number;
  originId: string;
  status: string;
  chapters: ChapterWithoutImagesPlainObject[];
  thumbImage: ImagePlainObject;
};
