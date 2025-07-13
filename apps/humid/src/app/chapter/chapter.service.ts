import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChapterEntity } from '../entities/chapter.entity';
import { ChapterNavigationResponseDto } from './dto/chapter-navigation-response.dto';
import { CrawlingStatus } from '../common';
import { MinimizeChapterResponseDto } from './dto/minimize-chapter-response.dto';
import { ChapterPlainObject } from '../models/types/chapter-plain-object';
import { CacheService } from '../common/services/cache.service';

@Injectable()
export class ChapterService {
  private readonly logger = new Logger(ChapterService.name);

  constructor(
    @InjectRepository(ChapterEntity)
    private readonly chapterRepository: Repository<ChapterEntity>,
    private cacheService: CacheService
  ) {}

  async getDetail(id: number): Promise<ChapterPlainObject & { comic: { id: number; title: string } }> {
    this.logger.log(`Getting chapter detail for id: ${id}`);

    const cacheKey = `chapter:${id}`;
    const cached = this.cacheService.get<ChapterPlainObject & { comic: { id: number; title: string } }>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for chapter detail: id=${id}`);
      return cached;
    }

    const chapter = await this.chapterRepository.findOne({
      where: { id },
      relations: ['images', 'comic'],
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }

    const comic = await chapter.comic;
    const result = {
      ...(await ChapterEntity.toJSON(chapter)),
      comic: {
        id: comic.id,
        title: comic.title,
      },
    };

    // Cache chapter detail for 30 minutes
    this.cacheService.set(cacheKey, result, 1800000);
    return result;
  }

  async getChaptersForNavigation(
    comicId: number
  ): Promise<ChapterNavigationResponseDto[]> {
    this.logger.log(`Getting all chapters for comic id: ${comicId}`);

    const cacheKey = `chapters:navigation:${comicId}`;
    const cached = this.cacheService.get<ChapterNavigationResponseDto[]>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for chapters navigation: comicId=${comicId}`);
      return cached;
    }

    // Optimize query by only selecting necessary fields
    const chapters = await this.chapterRepository
      .find({
        select: ['id', 'title', 'position'],
        where: { comic: { id: comicId } },
        order: { position: 'ASC' },
      })
      .then((r) => {
        return r.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          position: chapter.position,
        }));
      });

    if (!chapters || chapters.length === 0) {
      throw new NotFoundException(`No chapters found for comic id ${comicId}`);
    }

    // Cache navigation data for 20 minutes
    this.cacheService.set(cacheKey, chapters, 1200000);
    return chapters;
  }

  async getChaptersByComicId(
    comicId: number
  ): Promise<MinimizeChapterResponseDto[]> {
    this.logger.log(`Getting chapters for comic id: ${comicId}`);

    const cacheKey = `chapters:comic:${comicId}`;
    const cached = this.cacheService.get<MinimizeChapterResponseDto[]>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for chapters by comic: comicId=${comicId}`);
      return cached;
    }

    const chapters = await this.chapterRepository.find({
      where: { comic: { id: comicId }, crawlStatus: CrawlingStatus.DONE },
      order: { position: 'ASC' },
    });

    const result = await Promise.all(
      chapters.map((chapter) => ChapterEntity.toJSONWithoutImage(chapter))
    );

    // Cache chapters list for 15 minutes
    this.cacheService.set(cacheKey, result, 900000);
    return result;
  }

  // Method to clear cache when chapter is updated
  public clearChapterCache(chapterId?: number, comicId?: number): void {
    if (chapterId) {
      this.cacheService.delete(`chapter:${chapterId}`);
    }
    if (comicId) {
      this.cacheService.delete(`chapters:navigation:${comicId}`);
      this.cacheService.delete(`chapters:comic:${comicId}`);
    }
    this.logger.debug('Chapter cache cleared');
  }
}
