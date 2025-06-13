import {
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FileIoService } from '../file-io/file-io.service';
import { ComicService } from './comic.service';
import { ResponseMapper } from '../utils/response-mapper';
import { ComicPlainObject } from '../models/types/comic-plain-object';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from 'nestjs-zod';

@ApiTags('Comic')
@Controller('/api/v1/comic')
export class ComicController {
  private logger = new Logger(ComicController.name);

  constructor(
    private fileIoService: FileIoService,
    private comicService: ComicService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Search or retrieve all comics' })
  @ApiQuery({
    name: 'k',
    description: 'Optional search keyword to filter comics',
    required: false,
    type: String,
    example: 'superhero',
  })
  @ApiResponse({
    status: 200,
    description: 'List of comics retrieved successfully',
    type: () => ResponseMapper<Omit<ComicPlainObject, 'chapters'>[]>,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: () => ResponseMapper<null>,
  })
  public search(
    @Query('pages', new ZodValidationPipe(z.coerce.number().int().optional())) pages?: number,
    @Query('limit', new ZodValidationPipe(z.coerce.number().int().optional())) limit?: number,
  ) {
    if(!pages) pages = 0;
    if(!limit) limit = 10;
    return this.comicService.getComicsByPage(pages, limit);
  }

  @Get('/suggest')
  @ApiOperation({ summary: 'Search for comic suggestions by keyword' })
  @ApiQuery({
    name: 'q',
    description: 'Search keyword for comic suggestions',
    required: true,
    type: String,
    example: 'ss',
  })
  @ApiResponse({
    status: 200,
    description: 'Comic suggestions retrieved successfully',
    type: () => ResponseMapper<unknown[]>,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search keyword provided',
    type: () => ResponseMapper<null>,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: () => ResponseMapper<null>,
  })
  async suggestSearch(
    @Query('q', new ZodValidationPipe(z.string().min(1))) q: string
  ) {
    return this.comicService.searchComicsByKeyword(q, 'nettruyen');
  }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get comic details by ID including chapters (without images)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the comic to retrieve',
    required: true,
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Comic details retrieved successfully',
    type: () => ResponseMapper<ComicPlainObject>,
  })
  @ApiResponse({
    status: 404,
    description: 'Comic not found',
    type: () => ResponseMapper<null>,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: () => ResponseMapper<null>,
  })
  async getComicById(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching comic details for id: ${id}`);
    const comicDetail = await this.comicService.getComicById(id);
    return comicDetail;
  }
}
