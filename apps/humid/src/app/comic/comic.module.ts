import { Module } from '@nestjs/common';
import { ComicController } from './comic.controller';
import { ComicService } from './comic.service';
import { ComicEntity } from '../entities/comic';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module(
  {
    imports: [TypeOrmModule.forFeature([ComicEntity])],
    providers: [ComicService],
    controllers: [ComicController],
  }
)
export class ComicModule {}
