import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ComicEntity } from '../../entities/comic.entity';
import { DataSource, Repository } from 'typeorm';
import { ChapterEntity } from '../../entities/chapter.entity';
import { NettruyenHttpService } from '../../http/nettruyen-http.service';
import {
  CrawlChapterData,
  CrawlImageJobData,
  CrawlingStatus,
  ExtractChapterInfoResult$1,
  ExtractChapterInfoResultItem$1,
} from '../../common';
import { ImageType } from '../../common/constant/image';
import { NettruyenImageService } from './nettruyen-image.service';
import { Observable, Subject } from 'rxjs';
import { CrawlingQueueService } from './crawling-queue.service';
import { CrawlChapterRequestDto } from '../dto/crawl-chapter-request.dto';
import { CrawlChapterResponseDto } from '../dto/crawl-chapter-response.dto';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class NettruyenChapterService {
  private readonly logger = new Logger(NettruyenChapterService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private readonly comicRepository: Repository<ComicEntity>,
    private readonly dataSource: DataSource,
    private readonly imageService: NettruyenImageService,
    private readonly nettruyenHttpService: NettruyenHttpService,
    @InjectRepository(ChapterEntity)
    private readonly chapterRepository: Repository<ChapterEntity>,
    private readonly crawlingQueue: CrawlingQueueService,
    private readonly cacheService: CacheService
  ) {}

  async handleCrawlChapter(
    data: CrawlChapterData,
    chapterEntity?: ChapterEntity
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    this.logger.log(
      `Start handleCrawlChapter with params ${JSON.stringify(data)}`
    );

    try {
      const { domain, image } = await this.extractChapterInfo(data.url);
      const chapter = chapterEntity ?? new ChapterEntity();

      const comic = await this.comicRepository.findOneByOrFail({
        id: data.comicId,
      });

      if (!chapterEntity) {
        chapter.chapterNumber = data.chapNumber;
        chapter.position = data.position;
        chapter.title = 'Chapter ' + data.chapNumber;
        chapter.sourceUrl = data.url;
        chapter.comic = comic;
        chapter.chapterNumber = data.chapNumber;
      }
      chapter.crawlStatus = CrawlingStatus.ON_CRAWL;

      await queryRunner.manager.save(chapter);
      this.logger.log(`Save new chapter id=${chapter.id} with job data`);

      const requestImages = image.map((item) => {
        return {
          domain,
          type: ImageType.CHAPTER_IMAGE,
          position: item.position,
          dataUrls: item.imageUrls,
          chapterId: chapter.id,
        } satisfies CrawlImageJobData;
      });
      chapter.crawlStatus = CrawlingStatus.DONE;
      await this.imageService
        .handleCrawlImages(requestImages, queryRunner)
        .then((r) => {
          return r.filter((item) => !!item);
        });

      await queryRunner.manager.save(chapter);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Complete handleCrawlChapter with chapterId=${chapter.id}`
      );
      return chapter;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error handleCrawlChapter`);
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * Handles chapters for a given comic ID.
   * This method only processes chapters that are ready for crawling.
   * @param comicId - The ID of the comic to handle chapters for.
   * @returns An observable that emits chapter data without images.
   *
   */
  async handleChapterByComicId(
    comicId: number
  ): Promise<
    Observable<Awaited<ReturnType<typeof ChapterEntity.toJSONWithoutImage>>>
  > {
    this.logger.log(`START handleChapterByComicId with comicId=${comicId}`);
    const chapters = await this.chapterRepository.find({
      where: {
        comic: {
          id: comicId,
        },
        crawlStatus: CrawlingStatus.READY_FOR_CRAWL,
      },
      relations: ['images'],
    });

    if (!chapters || chapters.length === 0) {
      this.logger.warn(`No chapters found for comic with id ${comicId}`);
      // Return an empty observable that completes immediately
      return new Observable((subscriber) => {
        subscriber.complete();
      });
    }

    const sourcePublisher = new Subject<
      Awaited<ReturnType<typeof ChapterEntity.toJSONWithoutImage>>
    >();

    // Process chapters and handle errors properly
    this.processChaptersSequentially(chapters, sourcePublisher)
      .then(() => {
        sourcePublisher.complete();
        this.logger.log(
          `DONE handleChapterByComicId done with comicId=${comicId}`
        );
      })
      .catch((error: Error) => {
        sourcePublisher.error(error);
        this.logger.error(
          `ERROR handleChapterByComicId done with comicId=${comicId}: ${error.message}`
        );
      });

    return sourcePublisher.asObservable();
  }

  private async processChaptersSequentially(
    chapters: ChapterEntity[],
    sourcePublisher: Subject<
      Awaited<ReturnType<typeof ChapterEntity.toJSONWithoutImage>>
    >
  ) {
    for (const chapter of chapters) {
      try {
        await this.crawlingQueue.queueChapterTask({
          id: `chapter-${chapter.id}`,
          execute: async () => {
            if ((await chapter.images)?.length) {
              this.logger.warn(
                `Chapter ${chapter.id} already has images, skipping image extraction`
              );
              return;
            }

            chapter.crawlStatus = CrawlingStatus.ON_CRAWL;
            await chapter.save();

            const { domain, image } = await this.extractChapterInfo(
              chapter.sourceUrl
            );

            const requestImages = image.map((item) => {
              return {
                domain,
                type: ImageType.CHAPTER_IMAGE,
                position: item.position,
                dataUrls: item.imageUrls,
                chapterId: chapter.id,
              } satisfies CrawlImageJobData;
            });

            chapter.images = await this.imageService
              .handleCrawlImages(requestImages)
              .then((r) => {
                return r.filter((item) => !!item);
              });

            chapter.crawlStatus = CrawlingStatus.DONE;
            await chapter.save();

            this.logger.log(
              `PROCESS handleChapterByComicId done with chapterId=${chapter.id}`
            );

            return chapter;
          },
        });

        sourcePublisher.next(await ChapterEntity.toJSONWithoutImage(chapter));
        this.cacheService.clearChapterCache(chapter.id);
      } catch (chapterError) {
        this.logger.error(
          `Error processing chapter ${chapter.id}: ${
            (chapterError as Error).message || chapterError
          }`
        );
        // Continue processing other chapters instead of failing completely
      }
    }
  }

  private async extractChapterInfo(
    url: string
  ): Promise<ExtractChapterInfoResult$1> {
    const { data: body } = await this.nettruyenHttpService.get(url);
    const domain = new URL(url).origin;
    const imageRegex =
      /data-sv1=['"]([^'"]*)['"][^>]*data-sv2=['"]([^'"]*)['"]/g;
    const results: ExtractChapterInfoResult$1 = {
      image: [],
      domain: domain,
    };
    let dataUrls;
    let count = 0;
    while ((dataUrls = imageRegex.exec(body)) !== null) {
      results.image.push({
        imageUrls: [dataUrls[1] ?? '', dataUrls[2] ?? ''],
        position: count,
      } satisfies ExtractChapterInfoResultItem$1);
      count++;
    }
    return results;
  }

  async crawlIndividualChapter(
    data: CrawlChapterRequestDto
  ): Promise<CrawlChapterResponseDto | null> {
    this.logger.log(`START crawlChapter with chapter ID: ${data.chapterId}`);
    // Fetch the chapter from database using the injected repository
    const chapter = await this.chapterRepository.findOne({
      where: { id: data.chapterId },
      relations: ['comic'],
    });

    if (!chapter) {
      throw new BadRequestException('Chapter not found');
    }

    const comic = await chapter.comic;

    if (chapter.crawlStatus == CrawlingStatus.DONE) {
      this.logger.warn(`Chapter ${chapter.id} has already been crawled.`);
      return {
        chapterId: chapter.id,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.title,
        chapterUrl: chapter.sourceUrl,
        position: chapter.position,
        crawlStatus: chapter.crawlStatus,
        comicId: comic.id,
        comicTitle: comic.title || 'Unknown Comic',
        createdAt: new Date(chapter.createdAt),
        updatedAt: new Date(chapter.updatedAt),
      };
    }

    // Extract comic data and build CrawlChapterData
    const crawlData = {
      url: chapter.sourceUrl,
      chapNumber: chapter.chapterNumber,
      comicId: comic.id,
      position: chapter.position,
    };

    const result = await this.crawlingQueue.queueChapterTask({
      id: `chapter-${data.chapterId}`,
      priority: 1, // Give single chapter requests higher priority
      execute: async () => {
        // Use the existing chapter service method with extracted data
        return this.handleCrawlChapter(crawlData, chapter);
      },
    });

    const response: CrawlChapterResponseDto = {
      chapterId: result?.id || data.chapterId,
      chapterNumber: chapter.chapterNumber,
      chapterTitle: chapter.title,
      chapterUrl: chapter.sourceUrl,
      position: chapter.position,
      crawlStatus: chapter.crawlStatus,
      comicId: comic.id,
      comicTitle: comic.title || 'Unknown Comic',
      createdAt: new Date(chapter.createdAt),
      updatedAt: new Date(chapter.updatedAt),
    };
    this.logger.log(`DONE crawlChapter for chapter ID: ${data.chapterId}`);
    this.cacheService.clearChapterCache(data.chapterId, comic.id);
    return response;
  }
}
