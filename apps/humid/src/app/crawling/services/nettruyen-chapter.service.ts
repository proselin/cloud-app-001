import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ComicEntity } from '../../entities/comic.entity';
import { DataSource, QueryRunner, Repository } from 'typeorm';
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

@Injectable()
export class NettruyenChapterService {
  private readonly logger = new Logger(NettruyenChapterService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private comicRepository: Repository<ComicEntity>,
    private dataSource: DataSource,
    private imageService: NettruyenImageService,
    private readonly http: NettruyenHttpService,
    @InjectRepository(ChapterEntity)
    private readonly chapterRepository: Repository<ChapterEntity>
  ) {}

  async handleCrawlChapter(data: CrawlChapterData, queryRunner?: QueryRunner) {
    const isolate = !queryRunner;
    queryRunner ??= this.dataSource.createQueryRunner();
    if (!isolate) await queryRunner.startTransaction();
    this.logger.log(
      `Start handleCrawlChapter with params ${JSON.stringify(data)}`
    );

    try {
      const { domain, image } = await this.extractChapterInfo(data.url);

      const comic = await this.comicRepository.findOneByOrFail({
        id: data.comicId,
      });
      const chapter = new ChapterEntity();

      chapter.chapterNumber = data.chapNumber;
      chapter.position = data.position;
      chapter.title = 'Chapter ' + data.chapNumber;
      chapter.sourceUrl = data.url;
      chapter.comic = comic;
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

      chapter.images = await this.imageService
        .handleCrawlImages(requestImages, queryRunner)
        .then((r) => {
          return r.filter((item) => !!item);
        });
      if (!isolate) await queryRunner.commitTransaction();

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
    Promise.all(
      chapters.map(async (chapter) => {
        try {
          const { domain, image } = await this.extractChapterInfo(
            chapter.sourceUrl
          );

          if ((await chapter.images)?.length) {
            this.logger.warn(
              `Chapter ${chapter.id} already has images, skipping image extraction`
            );

            return;
          }
          chapter.crawlStatus = CrawlingStatus.ON_CRAWL;
          await chapter.save();

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
          sourcePublisher.next(await ChapterEntity.toJSONWithoutImage(chapter));
        } catch (chapterError) {
          this.logger.error(
            `Error processing chapter ${chapter.id}: ${
              (chapterError as Error).message || chapterError
            }`
          );
          // Continue processing other chapters instead of failing completely
        }
      })
    )
      .then(() => {
        sourcePublisher.complete();
        this.logger.log(
          `DONE handleChapterByComicId done with comicId=${comicId}`
        );
      })
      .catch((error) => {
        sourcePublisher.error(error);
        this.logger.error(
          `ERROR handleChapterByComicId done with comicId=${comicId}: ${error.message}`
        );
      });

    return sourcePublisher.asObservable();
  }

  private async extractChapterInfo(
    url: string
  ): Promise<ExtractChapterInfoResult$1> {
    const { data: body } = await this.http.get(url);
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
}
