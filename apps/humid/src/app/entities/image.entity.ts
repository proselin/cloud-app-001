import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { CommonEntity } from '../common';
import { ImagePlainObject } from '../models/types/image-plain-object';
import { ChapterEntity } from './chapter.entity';

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

  static async toJSON(entity?: ImageEntity): Promise<ImagePlainObject> {
    if (!entity) throw new Error('Entity is not an image');
    return {
      ...(await CommonEntity.toJSON(entity)),
      fileName: entity?.fileName,
      originUrls: entity?.originUrls,
      position: entity?.position,
      type: entity?.type,
    };
  }
}
