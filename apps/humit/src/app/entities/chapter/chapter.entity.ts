import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { CommonEntity } from '../../common';
import { ComicEntity } from '../comic';
import { ImageEntity } from '../image';

@Entity('chapter')
export class ChapterEntity extends CommonEntity {
  @Column({
    name: 'chapter_num',
  })
  chapterNumber: string;

  @Column({
    name: 'source_url',
    type: 'varchar',
  })
  sourceUrl: string;

  @Column({ type: String })
  title: string;

  @Column({
    type: 'int',
  })
  position: number;

  @Column({
    type: 'varchar',
    name: 'crawling_status',
  })
  crawlStatus: string;

  @ManyToOne(() => ComicEntity, (comic) => comic.chapters, {
    lazy: true,
  })
  @JoinColumn({
    name: 'comic_id',
  })
  comic: ComicEntity;

  @OneToMany(() => ImageEntity, (image) => image.chapter, {
    lazy: true,
  })
  images: ImageEntity[];
}
