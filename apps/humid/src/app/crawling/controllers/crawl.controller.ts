import { Controller, Logger, UseFilters } from '@nestjs/common';
import { ComicService } from '../services/comic.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ComicEntity } from '../../entities/comic';
import { z } from 'zod';
import { ExceptionFilter } from '../../filters/rpc-exception.filter';

@Controller()
export class CrawlController {
  private logger = new Logger('CrawlController');

  constructor(private comicService: ComicService) {}

  @UseFilters(new ExceptionFilter())
  @MessagePattern('crawling-by-url')
  async crawlingByComicUrl(@Payload() data: { comicUrl: string }) {
    this.logger.log(`START crawling-by-url comicUrl=${JSON.stringify(data)}`);
    const url = z.string().url().parse(data.comicUrl);
    throw new RpcException('No one can do it')
    return this.comicService
      .handleCrawlComic(url)
      .then(
        (r) =>
          JSON.parse(JSON.stringify(r)) as Record<
            keyof ComicEntity,
            ComicEntity[keyof ComicEntity]
          >
      );
  }
}
