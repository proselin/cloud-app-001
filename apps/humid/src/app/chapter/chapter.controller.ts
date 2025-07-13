import { Controller, Get, Logger, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChapterService } from './chapter.service';
import { ResponseMapper } from '../utils/response-mapper';
import { ChapterDetailResponseDto } from './dto/chapter-detail-response.dto';
import { MinimizeChapterResponseDto } from './dto/minimize-chapter-response.dto';
import { ChapterPlainObject } from '../models/types/chapter-plain-object';

@ApiTags('Chapter')
@Controller('api/v1/chapter')
export class ChapterController {
  private readonly logger = new Logger(ChapterController.name);

  constructor(private readonly chapterService: ChapterService) {}

  @Get('/:id')
  @ApiOperation({ summary: 'Get chapter details by ID' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Chapter ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Chapter details retrieved successfully',
    type: () => ResponseMapper<ChapterDetailResponseDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Chapter not found',
  })
  async getDetail(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ChapterPlainObject & { comic: { id: number; title: string } }> {
    this.logger.log(`Getting chapter detail for id: ${id}`);
    return this.chapterService.getDetail(id);
  }

  @Get('/by-comic/:comicId')
  @ApiOperation({ summary: 'Get all chapters by comic ID' })
  @ApiParam({
    name: 'comicId',
    type: 'number',
    description: 'Comic ID to get chapters for',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Chapters retrieved successfully',
    type: () => ResponseMapper<MinimizeChapterResponseDto[]>,
  })
  @ApiResponse({
    status: 404,
    description: 'No chapters found for the given comic ID',
  })
  async getChaptersByComicId(
    @Param('comicId', ParseIntPipe) comicId: number
  ): Promise<MinimizeChapterResponseDto[]> {
    this.logger.log(`Getting all chapters for comic id: ${comicId}`);

    return this.chapterService.getChaptersByComicId(comicId);
  }

  @Get('/navigation/:comicId')
  @ApiOperation({ summary: 'Get chapters for navigation by comic ID' })
  @ApiParam({
    name: 'comicId',
    type: 'number',
    description: 'Comic ID to get navigation chapters for',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Navigation chapters retrieved successfully',
    type: () => Array,
  })
  @ApiResponse({
    status: 404,
    description: 'No chapters found for the given comic ID',
  })
  async getChaptersForNavigation(
    @Param('comicId', ParseIntPipe) comicId: number
  ): Promise<{ id: number; title: string; position: number }[]> {
    this.logger.log(`Getting navigation chapters for comic id: ${comicId}`);
    return this.chapterService.getChaptersForNavigation(comicId);
  }
}
