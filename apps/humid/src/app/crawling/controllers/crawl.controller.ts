import {
  Body,
  Controller,
  Logger,
  Post,
  Query,
  Sse,
  UsePipes,
} from '@nestjs/common';
import { NettruyenComicService } from '../services/nettruyen-comic.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseMapper } from '../../utils/response-mapper';
import { CrawlByUrlRequestDto } from '../dto/crawl-by-url-request.dto';
import { CrawlComicByUrlResponseDto } from '../dto/crawl-by-url-response.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { map, Observable } from 'rxjs';
import { NettruyenChapterService } from '../services/nettruyen-chapter.service';
import { z } from 'zod';

@ApiTags('Crawl')
@Controller('/api/v1/crawl')
export class CrawlController {
  private logger = new Logger('CrawlController');

  constructor(
    private comicService: NettruyenComicService,
    private chapterService: NettruyenChapterService
  ) {}

  @Post('/by-url')
  @ApiOperation({ summary: 'Crawl comic data by URL' })
  @ApiBody({
    type: CrawlByUrlRequestDto,
    description: 'URL of the comic to crawl',
  })
  @ApiResponse({
    status: 200,
    description: 'Comic data retrieved successfully',
    type: () => ResponseMapper<CrawlComicByUrlResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid URL provided',
    type: () => ResponseMapper<null>,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: () => ResponseMapper<null>,
  })
  @UsePipes(ZodValidationPipe)
  async crawlingByComicUrl(
    @Body() data: CrawlByUrlRequestDto
  ): Promise<ResponseMapper<unknown>> {
    this.logger.log(`START crawling-by-url comicUrl=${JSON.stringify(data)}`);
    const comicData = await this.comicService.getComicByUrl(data.url);
    return ResponseMapper.success(comicData, 'Comic retrieved successfully');
  }

  @Sse('/crawl-chapter-by-id-sse')
  @ApiOperation({
    summary: 'Crawl chapter data by URL with SSE',
    description: 'Only crawl chapter which  have not been crawled yet',
  })
  async crawlComicByUrlSSE(
    @Query('comicId', new ZodValidationPipe(z.coerce.number().int()))
    comicId: number
  ): Promise<Observable<unknown>> {
    this.logger.log(`START crawling-by-url sse with comicId=${comicId}`);
    const chapterObservable = await this.chapterService.handleChapterByComicId(
      comicId
    );
    return chapterObservable.pipe(
      map((data) =>
        ResponseMapper.success(data, 'Comic chapter data streaming')
      )
    );
  }
}
