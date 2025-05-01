import { Controller, Logger, UseFilters } from '@nestjs/common';
import { ComicService } from '../services/comic.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ExceptionFilter } from '../../filters/rpc-exception.filter';

@Controller()
export class CrawlController {
  private logger = new Logger('CrawlController');

  constructor(private comicService: ComicService) {}

  @UseFilters(new ExceptionFilter())
  @MessagePattern('crawling-by-url')
  async crawlingByComicUrl(@Payload() data: { comicUrl: string }) {
    this.logger.log(`START crawling-by-url comicUrl=${JSON.stringify(data)}`);
    return this.comicService.getComicByUrl(data.comicUrl);
  }
}
