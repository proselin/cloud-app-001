import { Module } from '@nestjs/common';
import { ComicController } from './comic.controller';
import { ComicService } from './comic.service';
import { ComicEntity } from '../entities/comic';
import { TypeOrmModule } from '@nestjs/typeorm';
import {NettruyenHttpService} from "../http/nettruyen-http.service";

@Module(
  {
    imports: [TypeOrmModule.forFeature([ComicEntity])],
    providers: [ComicService, NettruyenHttpService],
    controllers: [ComicController],
  }
)
export class ComicModule {}
