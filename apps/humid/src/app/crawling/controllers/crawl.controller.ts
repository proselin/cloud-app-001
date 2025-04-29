import { Controller, Param, Post, Req, Res } from '@nestjs/common';
import {Response, Request} from 'express';
import { ComicService } from '../services/comic.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller('/crawl')
export class CrawlController {
  constructor(private comicService: ComicService) {}

  @Post(':type')
  public async crawling(
    @Param('type') type: string,
    @Res() res: Response,
    @Req() req: Request
  ) {

    const result = await this.comicService.handleCrawlComic(req.body.href);
    res.status(200).json(result);
  }

  @MessagePattern({ cmd: 'sum' })
  accumulate(data: number[]): number {
    return (data || []).reduce((a, b) => a + b);
  }

  @MessagePattern('hello')
  hello(data: string): string {
    return "Hello World!";
  }
}
