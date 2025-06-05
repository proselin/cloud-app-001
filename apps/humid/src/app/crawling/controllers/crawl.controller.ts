import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ComicService } from '../services/comic.service';
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import { z } from 'zod';
import {
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMapper } from '../../utils/response-mapper';


// Define the input DTO for Swagger
class CrawlByUrlDto {
  @ApiProperty({ description: 'URL of the comic to crawl', example: 'https://example.com/comic' })
  url: string;

  @ApiProperty({ description: 'A Check that should crawling chapter after done crawling comics', example: false })
  isCrawlChapter: string;
}

@ApiTags('Crawl')
@Controller('/api/v1/crawl')
export class CrawlController {
  private logger = new Logger('CrawlController');

  constructor(private comicService: ComicService) {}

  @Post('/by-url')
  @ApiOperation({ summary: 'Crawl comic data by URL' })
  @ApiBody({ type: CrawlByUrlDto, description: 'URL of the comic to crawl' })
  @ApiResponse({
    status: 200,
    description: 'Comic data retrieved successfully',
    type: () => ResponseMapper<any>,
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
  async crawlingByComicUrl(
    @Body(
      new ZodValidationPipe(
        z.object({
          url: z.string().url(),
          isCrawlChapter: z.boolean().optional().default(false),
        })
      )
    )
    data: { url: string, isCrawlChapter: boolean }
  ) {
    this.logger.log(`START crawling-by-url comicUrl=${JSON.stringify(data)}`);
    const comicData = await this.comicService.getComicByUrl(data.url, data.isCrawlChapter);
    return ResponseMapper.success(comicData, 'Comic retrieved successfully');
  }
}
