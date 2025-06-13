import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { CommonEntity } from '../common';
import { ChapterWithoutImagesPlainObject } from '../models/types/chapter-without-images-plain-object';
import { ChapterPlainObject } from '../models/types/chapter-plain-object';
import { ImageEntity } from './image.entity';
import { IComicEntity } from './types/entity-interfaces';

@Entity('chapter')
export class ChapterEntity extends CommonEntity {
  @Column({
    name: 'chapter_num',
  })
  chapterNumber!: string;

  @Column({
    name: 'source_url',
    type: 'varchar',
  })
  sourceUrl!: string;

  @Column({ type: String })
  title!: string;

  @Column({
    type: 'int',
  })
  position!: number;

  @Column({
    type: 'varchar',
    name: 'crawling_status',
  })
  crawlStatus!: string;

  @ManyToOne('ComicEntity', (comic: IComicEntity) => comic.chapters, {
    lazy: true,
  })
  @JoinColumn({
    name: 'comic_id',
  })
  comic!: IComicEntity;

  @OneToMany(() => ImageEntity, (image) => image.chapter, {
    lazy: true,
  })
  images!: ImageEntity[] | Promise<ImageEntity[]>;

  static async toJSONWithoutImage(
    chapter: ChapterEntity
  ): Promise<ChapterWithoutImagesPlainObject> {
    return {
      ...(await CommonEntity.toJSON(chapter)),
      chapterNumber: chapter.chapterNumber,
      sourceUrl: chapter.sourceUrl,
      title: chapter.title,
      position: chapter.position,
      crawlStatus: chapter.crawlStatus,
    };
  }

  static async toJSON(chapter: ChapterEntity): Promise<ChapterPlainObject> {
    return {
      ...(await CommonEntity.toJSON(chapter)),
      chapterNumber: chapter.chapterNumber,
      sourceUrl: chapter.sourceUrl,
      title: chapter.title,
      position: chapter.position,
      crawlStatus: chapter.crawlStatus,
      images: await Promise.all(
        (await chapter.images).map((image) => ImageEntity.toJSON(image))
      ),
    };
  }
}
