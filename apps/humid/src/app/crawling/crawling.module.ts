import { Module } from '@nestjs/common';
import { NettruyenChapterService } from './services/nettruyen-chapter.service';
import { NettruyenImageService } from './services/nettruyen-image.service';
import { NettruyenComicService } from './services/nettruyen-comic.service';
import { CrawlController } from './controllers/crawl.controller';
import { NettruyenHttpService } from '../http/nettruyen-http.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComicEntity } from '../entities/comic.entity';
import { ChapterEntity } from '../entities/chapter.entity';
import { ImageEntity } from '../entities/image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComicEntity, ChapterEntity, ImageEntity]),
  ],
  controllers: [CrawlController],
  providers: [
    NettruyenHttpService,
    NettruyenComicService,
    NettruyenChapterService,
    NettruyenImageService,
  ],
})
export class CrawlingModule {}
