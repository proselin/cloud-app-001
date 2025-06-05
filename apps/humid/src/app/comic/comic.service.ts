import {Injectable, Logger} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ComicEntity } from '../entities/comic';
import { Repository } from 'typeorm';
import {firstValueFrom} from "rxjs";
import * as cheerio from 'cheerio';
import {HttpService} from "@nestjs/axios";
import {SuggestComicDto} from "../models/internals/suggest-comic.dto";
import {NettruyenHttpService} from "../http/nettruyen-http.service";

@Injectable()
export class ComicService {
  private logger = new Logger(ComicService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private readonly comicRepository: Repository<ComicEntity>,
    private httpService: HttpService,
    private nettruyenHttpService: NettruyenHttpService,
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

  public async searchComicsByKeyword(key: string, model: "nettruyen") {
    switch (model) {
      case 'nettruyen': {
        this.logger.log(`START suggest-search query=${key}`);
        try {
          return this.nettruyenHttpService.suggestSearch(key, "https://nettruyenrr.com");
        }catch (error) {
          throw new Error('Failed to fetch or parse comic suggestions');
        }
      }
    }
  }
}
