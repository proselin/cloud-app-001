import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChapterEntity } from '../entities/chapter.entity';
import { ChapterNavigationResponseDto } from './dto/chapter-navigation-response.dto';
import { CrawlingStatus } from '../common';
import { MinimizeChapterResponseDto } from './dto/minimize-chapter-response.dto';
import { ChapterPlainObject } from '../models/types/chapter-plain-object';

@Injectable()
export class ChapterService {
  private readonly logger = new Logger(ChapterService.name);

  constructor(
    @InjectRepository(ChapterEntity)
    private readonly chapterRepository: Repository<ChapterEntity>
  ) {}

  async getDetail(id: number): Promise<ChapterPlainObject> {
    this.logger.log(`Getting chapter detail for id: ${id}`);

    const chapter = await this.chapterRepository.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }

    return ChapterEntity.toJSON(chapter);
  }

  async getChaptersForNavigation(
    comicId: number
  ): Promise<ChapterNavigationResponseDto[]> {
    this.logger.log(`Getting all chapters for comic id: ${comicId}`);

    const chapters = await this.chapterRepository
      .find({
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

    return chapters;
  }

  async getChaptersByComicId(
    comicId: number
  ): Promise<MinimizeChapterResponseDto[]> {
    this.logger.log(`Getting chapters for comic id: ${comicId}`);
    const chapters = await this.chapterRepository.find({
      where: { comic: { id: comicId }, crawlStatus: CrawlingStatus.DONE },
      order: { position: 'ASC' },
    });
    return Promise.all(
      chapters.map((chapter) => ChapterEntity.toJSONWithoutImage(chapter))
    );
  }
}
