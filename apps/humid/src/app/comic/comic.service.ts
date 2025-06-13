import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ComicEntity } from '../entities/comic.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { NettruyenHttpService } from '../http/nettruyen-http.service';
import { ComicPlainObject } from '../models/types/comic-plain-object';

@Injectable()
export class ComicService {
  private logger = new Logger(ComicService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private readonly comicRepository: Repository<ComicEntity>,
    private httpService: HttpService,
    private nettruyenHttpService: NettruyenHttpService
  ) {}

  public async getAllComic() {
    return this.comicRepository.find().then(async (comics) => {
      return Promise.all(
        comics.map((comic) => {
          return ComicEntity.toJSONWithoutChapter(comic);
        })
      );
    });
  }

  public async getComicsByPage(
    page = 0,
    limit = 10
  ):Promise<Omit<ComicPlainObject, "chapters">[]> {
    this.logger.log(`Fetching comics with page=${page}, limit=${limit}`);
    const [comics, total] = await this.comicRepository.findAndCount({
      skip: page * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['thumbImage'],
    });
    this.logger.log(`Total comics found: ${total}`);
    return Promise.all(
      comics.map((comic) => {
        return ComicEntity.toJSONWithoutChapter(comic);
      })
    );
  }

  public async searchComicsByKeyword(key: string, model: 'nettruyen') {
    switch (model) {
      case 'nettruyen': {
        this.logger.log(`START suggest-search query=${key}`);
        try {
          return this.nettruyenHttpService.suggestSearch(
            key,
            'https://nettruyenrr.com'
          );
        } catch {
          throw new Error('Failed to fetch or parse comic suggestions');
        }
      }
    }
  }

  public async getComicById(id: number): Promise<ComicPlainObject> {
    this.logger.log(`Getting comic detail for id: ${id}`);

    const comic = await this.comicRepository.findOne({
      where: { id },
      relations: ['chapters', 'thumbImage'],
    });

    if (!comic) {
      throw new NotFoundException(`Comic with id ${id} not found`);
    }

    return ComicEntity.toJSON(comic);
  }
}
