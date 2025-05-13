import { BaseEntity, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export abstract class CommonEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number ;

  @CreateDateColumn({ type: "date" }) // Automatically stores the creation timestamp
  createdAt!: Date;

  @UpdateDateColumn({ type: "date" }) // Automatically updates the timestamp on modification
  updatedAt!: Date;

  static toJSON(entity?: CommonEntity): object {
    return {
      id: entity?.id,
      updatedAt: entity?.updatedAt,
      createdAt: entity?.createdAt
    }
  }
}
