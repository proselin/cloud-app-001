import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";

import { CommonEntity, CrawlingStatus } from "../../common";
import { ImageEntity } from "../image";
import { ChapterEntity } from "../chapter";

@Entity("comic")
export class ComicEntity extends CommonEntity {
  @Column()
  title: string;

  @Column({
    name: "chapter_count",
    type: "integer",
  })
  chapterCount: number;

  @Column({
    name: "origin_id",
    unique: true,
    nullable: false,
  })
  originId: string;

  @Column({
    nullable: true,
  })
  status: string;

  @Column({
    nullable: true,
  })
  description: string;

  @Column({
    name: "origin_url",
  })
  originUrl: string;

  @Column({
    name: "should_refresh",
    type: "boolean",
    default: false,
  })
  shouldRefresh: boolean;

  @Column({
    type: "varchar",
    default: "",
  })
  tags: string;

  @Column({
    type: "varchar",
    default: "",
  })
  author: string;

  @Column({
    type: "varchar",
    name: "crawling_status",
  })
  crawlStatus: CrawlingStatus;

  @OneToMany(() => ChapterEntity, chapter => chapter.comic, {
    lazy: true,
  })
  chapters: ChapterEntity[];

  @OneToOne(() => ImageEntity, {
    lazy: true,
  })
  @JoinColumn({
    name: 'thumb_image_id',
  })
  thumbImage: ImageEntity;
}
