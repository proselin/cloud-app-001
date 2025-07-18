import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';

import { CommonEntity, CrawlingStatus } from '../common';
import { ComicPlainObject } from '../models/types/comic-plain-object';
import { ChapterEntity } from './chapter.entity';
import { ImageEntity } from './image.entity';

@Entity('comic')
export class ComicEntity extends CommonEntity {
  @Column()
  title!: string;

  @Column({
    name: 'chapter_count',
    type: 'integer',
  })
  chapterCount!: number;

  @Column({
    name: 'origin_id',
    unique: true,
    nullable: false,
  })
  originId!: string;

  @Column({
    nullable: true,
  })
  status!: string;

  @Column({
    nullable: true,
  })
  description!: string;

  @Column({
    name: 'origin_url',
  })
  originUrl!: string;

  @Column({
    name: 'should_refresh',
    type: 'boolean',
    default: false,
  })
  shouldRefresh!: boolean;

  @Column({
    type: 'varchar',
    default: '',
  })
  tags!: string;

  @Column({
    type: 'varchar',
    default: '',
  })
  author!: string;

  @Column({
    type: 'varchar',
    name: 'crawling_status',
  })
  crawlStatus!: CrawlingStatus;

  @OneToMany(() => ChapterEntity, (chapter) => chapter.comic, {
    lazy: true,
  })
  chapters!: ChapterEntity[] | Promise<ChapterEntity[]>;

  @JoinColumn({
    name: 'thumb_image_id',
  })
  @OneToOne(() => ImageEntity, {
    eager: true,
    nullable: true,
    createForeignKeyConstraints: true,
  })
  thumbImage!: ImageEntity;

  static async toJSONWithoutChapter(
    entity: ComicEntity
  ): Promise<Omit<ComicPlainObject, 'chapters'>> {
    await Promise.resolve(entity.thumbImage);
    return {
      ...(await CommonEntity.toJSON(entity)),
      title: entity?.title,
      description: entity?.description,
      chapterCount: entity?.chapterCount,
      originId: entity?.originId,
      status: entity?.status,
      thumbImage: await ImageEntity.toJSON(entity?.thumbImage),
    };
  }
  static async toJSON(entity: ComicEntity): Promise<ComicPlainObject> {
    await Promise.resolve(entity.thumbImage);

    return {
      ...(await CommonEntity.toJSON(entity)),
      title: entity?.title,
      description: entity?.description,
      chapterCount: entity?.chapterCount,
      originId: entity?.originId,
      status: entity?.status,
      chapters: await Promise.all(
        (
          await entity.chapters
        )?.map((chapter) => ChapterEntity.toJSONWithoutImage(chapter))
      ),
      thumbImage: await ImageEntity.toJSON(entity?.thumbImage),
    };
  }
}
