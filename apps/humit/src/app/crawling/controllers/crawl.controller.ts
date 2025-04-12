import { Controller, Param, Post, Req, Res } from '@nestjs/common';
import {Response, Request} from 'express';
import { ComicService } from '../services/comic.service';

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
}
