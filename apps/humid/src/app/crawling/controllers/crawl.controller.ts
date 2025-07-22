import {
  Body,
  Controller,
  Get,
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
import { CrawlChapterRequestDto } from '../dto/crawl-chapter-request.dto';
import { CrawlChapterResponseDto } from '../dto/crawl-chapter-response.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { map, Observable } from 'rxjs';
import { NettruyenChapterService } from '../services/nettruyen-chapter.service';
import { CrawlingQueueService } from '../services/crawling-queue.service';
import { z } from 'zod';
import { InjectRepository } from '@nestjs/typeorm';
import { ChapterEntity } from '../../entities/chapter.entity';
import { Repository } from 'typeorm';

@ApiTags('Crawl')
@Controller('/api/v1/crawl')
export class CrawlController {
  private logger = new Logger('CrawlController');

  constructor(
    private comicService: NettruyenComicService,
    private chapterService: NettruyenChapterService,
    private crawlingQueue: CrawlingQueueService,
    @InjectRepository(ChapterEntity)
    private readonly chapterRepository: Repository<ChapterEntity>
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

  @Post('/chapter')
  @ApiOperation({
    summary: 'Crawl a single chapter',
    description: 'Crawl a specific chapter using the queue system with configurable concurrency'
  })
  @ApiBody({
    type: CrawlChapterRequestDto,
    description: 'Chapter data to crawl',
  })
  @ApiResponse({
    status: 200,
    description: 'Chapter crawled successfully',
    type: () => ResponseMapper<CrawlChapterResponseDto>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid chapter data provided',
    type: () => ResponseMapper<null>,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: () => ResponseMapper<null>,
  })
  @UsePipes(ZodValidationPipe)
  async crawlChapter(
    @Body() data: CrawlChapterRequestDto
  ): Promise<CrawlChapterResponseDto | null> {
    return  this.chapterService.crawlIndividualChapter(data)
  }

  @Get('/queue-status')
  @ApiOperation({ summary: 'Get crawling queue status' })
  @ApiResponse({
    status: 200,
    description: 'Queue status retrieved successfully',
    type: () => ResponseMapper<unknown>,
  })
  async getQueueStatus(): Promise<ResponseMapper<unknown>> {
    const status = this.crawlingQueue.getQueueStatus();
    return ResponseMapper.success(status, 'Queue status retrieved successfully');
  }
}
