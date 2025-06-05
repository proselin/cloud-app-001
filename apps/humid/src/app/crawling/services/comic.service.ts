import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ComicEntity } from '../../entities/comic';
import { DataSource, Repository } from 'typeorm';
import { NettruyenHttpService } from '../../http/nettruyen-http.service';
import {
  CrawlChapterData,
  CrawlingStatus,
  InfoExtractedResult$1,
} from '../../common';
import { ExtractNettruyenImpl } from '../extractor/extract-nettruyen-impl';
import { ImageService } from './image.service';
import { ImageType } from '../../common/constant/image';
import { ChapterService } from './chapter.service';
import { z } from 'zod';
import { COMIC_NOT_FOUND_BY_URL } from '../../exceptions/exceptions';

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

  private async pullNewComic(
    href: string,
    crawledInformation: InfoExtractedResult$1,
    crawlChapters = true
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      this.logger.log(`START [handleCrawlComic] with href=${href}`);
      await queryRunner.startTransaction();

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

      comic.thumbImage = await this.imageService.handleCrawlThumb(
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

      if(crawlChapters) {
        await Promise.all(
          dataCrawlingChapters.map((chapter) => {
            return this.chapterService.handleCrawlChapter(chapter, queryRunner);
          })
        );
      }


      await queryRunner.commitTransaction();

      this.logger.log(`DONE [handleCrawlComic] with href=${href}`);
      return comic;
    } catch (e) {
      this.logger.error(e);
      await queryRunner.rollbackTransaction();
      throw e;
    }
  }

  private async getComicOrCrawlNew(href: string, isCrawlChapter: boolean) {
    this.logger.log(`START [getIdOrCrawlNew] with href=${href}`);
    const crawledInformation = await this.extractInfo(href).catch(() => {
      throw COMIC_NOT_FOUND_BY_URL;
    });
    const comic = await this.comicRepository.findOneBy({
      originId: crawledInformation.comicId,
    });
    if (!comic) {
      this.logger.log(
        `[getIdOrCrawlNew] not found comic by url try to pull new`
      );
      return this.pullNewComic(href, crawledInformation, isCrawlChapter).then((r) => {
        this.logger.log(`DONE [getIdOrCrawlNew]`);
        return r;
      });
    }
    this.logger.log(`DONE [getIdOrCrawlNew]`);
    return comic;
  }

  private async extractInfo(url: string): Promise<InfoExtractedResult$1> {
    const response = await this.nettruyenHttpService.get(url);
    const extractor = new ExtractNettruyenImpl();
    return extractor
      .setHttp(this.nettruyenHttpService)
      .setUrl(url)
      .setHtmlContent(response.data)
      .extract();
  }

  public async getComicByUrl(url: string, isCrawlChapter: boolean) {
    this.logger.log(`START [getComicByUrl] with href=${url}`);
    url = z.string().url().parse(url);
    const comic = await this.comicRepository
      .findOneBy({
        originUrl: url,
      })
      .then(async (r) => {
        this.logger.log(`DONE [getComicByUrl]`);
        return r;
      });

    if (!comic) {
      return this.getComicOrCrawlNew(url, isCrawlChapter).then(async (r) => {
        this.logger.log(`DONE [getComicByUrl]`);
        return ComicEntity.mapWithThumb(r);
      });
    }
    return ComicEntity.mapWithThumb(comic);
  }
}
