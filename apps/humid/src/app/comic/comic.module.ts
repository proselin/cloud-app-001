import { Module } from '@nestjs/common';
import { ComicController } from './comic.controller';
import { ComicService } from './comic.service';
import { ComicEntity } from '../entities/comic.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NettruyenHttpService } from '../http/nettruyen-http.service';
import { ChapterModule } from '../chapter/chapter.module';

@Module({
  imports: [TypeOrmModule.forFeature([ComicEntity]), ChapterModule],
  providers: [ComicService, NettruyenHttpService],
  controllers: [ComicController],
})
export class ComicModule {}
