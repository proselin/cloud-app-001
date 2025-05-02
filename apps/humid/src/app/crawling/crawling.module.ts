import { Module } from '@nestjs/common';
import { ChapterService } from './services/chapter.service';
import { ImageService } from './services/image.service';
import { ComicService } from './services/comic.service';
import { CrawlController } from './controllers/crawl.controller';
import { NettruyenHttpService } from './services/nettruyen-http.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComicEntity } from '../entities/comic';
import { ChapterEntity } from '../entities/chapter';
import { ImageEntity } from '../entities/image';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComicEntity, ChapterEntity, ImageEntity]),
  ],
  controllers: [CrawlController],
  providers: [NettruyenHttpService, ComicService, ChapterService, ImageService],
})
export class CrawlingModule {}
