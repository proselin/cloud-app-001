import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ComicEntity } from '../../entities/comic';
import { DataSource, Repository } from 'typeorm';
import { NettruyenHttpService } from './nettruyen-http.service';
import {
  CrawlChapterData,
  CrawlingStatus,
  InfoExtractedResult$1,
} from '../../common';
import { ExtractNettruyenImpl } from '../extractor/extract-nettruyen-impl';
import { ImageService } from './image.service';
import { ImageType } from '../../common/constant/image';
import { ChapterService } from './chapter.service';

@Injectable()
export class ComicService {
  private logger = new Logger(ComicService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private readonly comicRepository: Repository<ComicEntity>,
    private readonly dataSource: DataSource,
    private readonly nettruyenHttpService: NettruyenHttpService,
    private readonly imageService: ImageService,
    private readonly chapterService: ChapterService
  ) {}

  async handleCrawlComic(href: string) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      this.logger.log(`START [handleCrawlComic] with href=${href}`)
      await queryRunner.startTransaction();
      const crawledInformation = await this.extractInfo(href);
      await this.comicRepository
        .existsBy({ originId: crawledInformation.comicId })
        .then((r) => {
          if (r) throw new Error('comic is already exists');
        });

      const comic: ComicEntity = new ComicEntity();
      // comic.urlHistory = [href];
      comic.originUrl = href;

      comic.originId = crawledInformation.comicId;

      if (crawledInformation.title) {
        comic.title = crawledInformation.title;
      }

      comic.chapterCount = +crawledInformation.chapters.length;
      comic.crawlStatus = CrawlingStatus.ON_CRAWL;

      this.logger.log('Process create new comic');
      await queryRunner.manager.save(comic);

      await this.imageService.handleCrawlThumb(
        {
          comicId: comic.id,
          type: ImageType.THUMB,
          domain: crawledInformation.domain,
          dataUrls: [crawledInformation.thumbUrl],
          position: 0,
        },
        queryRunner
      );

      const length = crawledInformation.chapters.length;
      const dataCrawlingChapters = crawledInformation.chapters.map(
        (chapter, index) => {
          return {
            url: chapter.href,
            chapNumber: chapter.chapterNumber,
            comicId: comic.id,
            position: length - index,
          } satisfies CrawlChapterData;
        }
      );

      await Promise.all(
        dataCrawlingChapters.map((chapter) => {
          return this.chapterService.handleCrawlChapter(chapter, queryRunner);
        })
      );
      // await runWithConcurrency(
      //   dataCrawlingChapters.map((chapter) => {
      //     return this.chapterService.handleCrawlChapter(chapter, queryRunner);
      //   }),
      //   6
      // );


      await queryRunner.commitTransaction();

      this.logger.log(`DONE [handleCrawlComic] with href=${href}`)
      return comic;
    } catch (e) {
      this.logger.error(e);
      await queryRunner.rollbackTransaction();
      throw e;
    }
  }

  async extractInfo(url: string): Promise<InfoExtractedResult$1> {
    const response = await this.nettruyenHttpService.get(url);
    const extractor = new ExtractNettruyenImpl();
    return extractor
      .setHttp(this.nettruyenHttpService)
      .setUrl(url)
      .setHtmlContent(response.data)
      .extract();
  }
}
