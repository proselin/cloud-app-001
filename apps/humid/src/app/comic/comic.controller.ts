import { Controller, Get, Logger, Query } from '@nestjs/common';
import { FileIoService } from '../file-io/file-io.service';
import { ComicService } from './comic.service';
import { ResponseMapper } from '../utils/response-mapper';
import {
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {ZodValidationPipe} from "../pipes/zod-validation.pipe";
import {z} from "zod";
import {firstValueFrom} from "rxjs";

// Define the comic data structure for Swagger (adjust based on your actual comic data)
class ComicDto {
  @ApiProperty({ description: 'ID of the comic', example: 1 })
  id!: number;

  @ApiProperty({ description: 'Title of the comic', example: 'My Comic' })
  title!: string;

  @ApiProperty({ description: 'URL of the comic', example: 'https://example.com/comic' })
  url!: string;
}

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
    type: () => ResponseMapper<ComicDto[]>,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: () => ResponseMapper<null>,
  })
  public search(@Query('k') key?: string) {
    return ResponseMapper.success(this.comicService.getAllComic());
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
    type: () => ResponseMapper<ComicDto[]>,
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
    return this.comicService.searchComicsByKeyword(q, 'nettruyen')
  }
}
