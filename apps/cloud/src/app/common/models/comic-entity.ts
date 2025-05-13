import { CommonEntity } from './common-entity';
import { ImageEntity } from './image-entity';

export type ComicEntity = CommonEntity & {
  title: string;
  description: string;
  chapterCount: number;
  originId: string;
  status: string;
  thumbImage?: ImageEntity;
};
