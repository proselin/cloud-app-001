import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";

import { CommonEntity, CrawlingStatus } from "../../common";
import { ImageEntity } from "../image";
import { ChapterEntity } from "../chapter";

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

  @OneToMany(() => ChapterEntity, (chapter) => chapter.comic)
  chapters!: ChapterEntity[];

  @JoinColumn({
    name: 'thumb_image_id'
  })
  @OneToOne(() => ImageEntity, {
    eager: true,
    nullable: true,
    createForeignKeyConstraints: true
  })
  thumbImage!: ImageEntity;

  static async mapWithThumb(entity: ComicEntity) {
    await Promise.resolve(entity.thumbImage);
    return {
      ...CommonEntity.toJSON(entity),
      title: entity?.title,
      description: entity?.description,
      chapterCount: entity?.chapterCount,
      originId: entity?.originId,
      status: entity?.status,
      thumbImage: ImageEntity.toJSON(entity?.thumbImage),
    }
  }
}
