import {
  BaseEntity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CommonEntityPlainObject } from '../../models/types/common-entity-plain-object';

export abstract class CommonEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ type: 'date' }) // Automatically stores the creation timestamp
  createdAt!: Date | string;

  @UpdateDateColumn({ type: 'date' }) // Automatically updates the timestamp on modification
  updatedAt!: Date | string;

  static async toJSON(entity?: CommonEntity): Promise<CommonEntityPlainObject> {
    if (!entity) throw new Error('Entity is not common');
    return {
      id: entity.id,
      updatedAt: entity.updatedAt,
      createdAt: entity.createdAt,
    };
  }
}
