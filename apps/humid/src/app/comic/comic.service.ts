import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ComicEntity } from '../entities/comic';
import { Repository } from 'typeorm';

@Injectable()
export class ComicService {
  constructor(
    @InjectRepository(ComicEntity)
    private readonly comicRepository: Repository<ComicEntity>
  ) {}

  public async getAllComic() {
    return this.comicRepository.find().then(async (comics) => {
      return Promise.all(
        comics.map((comic) => {
          return ComicEntity.mapWithThumb(comic);
        })
      );
    });
  }
}
