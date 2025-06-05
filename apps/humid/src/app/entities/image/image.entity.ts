import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { CommonEntity } from '../../common';
import { ChapterEntity } from '../chapter';


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

  @ManyToOne(() => ChapterEntity, (chapter) => chapter.images, {
    createForeignKeyConstraints: true,
    nullable: true, // Reverted from false to true
  })
  @JoinColumn({
    name: 'chapter_id',
  })
  chapter!: ChapterEntity | Partial<ChapterEntity>;

  static toJSON(entity?: ImageEntity): object {
    if(entity?.id) {
      return {
        ...CommonEntity.toJSON(entity),
        fileName: entity?.fileName,
        originUrls: entity?.originUrls,
        position: entity?.position,
        type: entity?.type,
      }
    }
    return {}
  }
}
