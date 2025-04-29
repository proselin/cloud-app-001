import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import { CommonEntity } from '../../common';
import { ChapterEntity } from '../chapter';
import { ComicEntity } from '../comic';

@Entity('image')
export class ImageEntity extends CommonEntity {
  @Column({
    type: 'varchar',
    length: 1000,
  })
  fileName!: string;

  @Column({
    type: 'integer',
  })
  position!: number;

  @Column({
    type: 'int',
    default: 1,
  })
  type!: number;

  @Column({ type: 'varchar', name: 'origin_urls' })
  originUrls!: string;

  @ManyToOne(() => ChapterEntity, (chapter) => chapter.images)
  @JoinColumn({
    name: 'chapter_id',
  })
  chapter!: ChapterEntity | Partial<ChapterEntity>;

  @OneToOne(() => ComicEntity)
  @JoinColumn({
    name: 'comic_id',
  })
  comic!: ComicEntity | Partial<ComicEntity>;
}
