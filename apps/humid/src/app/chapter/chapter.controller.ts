import { Controller, Get, Logger, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChapterService } from './chapter.service';
import { ResponseMapper } from '../utils/response-mapper';
import { ChapterNavigationResponseDto } from './dto/chapter-navigation-response.dto';
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
  ): Promise<ResponseMapper<ChapterPlainObject>> {
    this.logger.log(`Getting chapter detail for id: ${id}`);
    const chapter = await this.chapterService.getDetail(id);
    return ResponseMapper.success(
      chapter,
      'Chapter details retrieved successfully'
    );
  }

  @Get('/navigation/:comicId')
  @ApiOperation({ summary: 'Get all chapters for navigation by comic ID' })
  @ApiParam({
    name: 'comicId',
    type: 'number',
    description: 'Comic ID to get chapters for',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Chapters retrieved successfully',
    type: () => ResponseMapper<ChapterNavigationResponseDto[]>,
  })
  @ApiResponse({
    status: 404,
    description: 'No chapters found for the given comic ID',
  })
  async getChaptersForNavigation(
    @Param('comicId', ParseIntPipe) comicId: number
  ): Promise<ResponseMapper<ChapterNavigationResponseDto[]>> {
    this.logger.log(`Getting all chapters for comic id: ${comicId}`);

    const chapters = await this.chapterService.getChaptersForNavigation(
      comicId
    );
    return ResponseMapper.success(chapters, 'Chapters retrieved successfully');
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
  ): Promise<ResponseMapper<MinimizeChapterResponseDto[]>> {
    this.logger.log(`Getting all chapters for comic id: ${comicId}`);

    const chapters = await this.chapterService.getChaptersByComicId(comicId);
    return ResponseMapper.success(chapters, 'Chapters retrieved successfully');
  }
}
