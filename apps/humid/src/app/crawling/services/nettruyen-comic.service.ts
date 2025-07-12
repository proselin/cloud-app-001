import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NettruyenHttpService } from '../../http/nettruyen-http.service';
import { CrawlingStatus, InfoExtractedResult$1 } from '../../common';
import { ExtractNettruyenImpl } from '../extractor/extract-nettruyen-impl';
import { NettruyenImageService } from './nettruyen-image.service';
import { ImageType } from '../../common/constant/image';
import { NettruyenChapterService } from './nettruyen-chapter.service';
import { z } from 'zod';
import { COMIC_NOT_FOUND_BY_URL } from '../../exceptions/exceptions';
import { ChapterEntity } from '../../entities/chapter.entity';
import { ComicEntity } from '../../entities/comic.entity';

@Injectable()
export class NettruyenComicService {
  private logger = new Logger(NettruyenComicService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private readonly comicRepository: Repository<ComicEntity>,
    private readonly dataSource: DataSource,
    private readonly nettruyenHttpService: NettruyenHttpService,
    private readonly imageService: NettruyenImageService,
    private readonly chapterService: NettruyenChapterService
  ) {}

  private async pullNewComic(
    href: string,
    crawledInformation: InfoExtractedResult$1
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
      // Save comic first to get the ID
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

      // Save comic with thumbImage reference
      await queryRunner.manager.save(comic);
      this.logger.log('Thumb image created and comic updated successfully');

      // Create and save chapters after comic has an ID
      const length = crawledInformation.chapters.length;
      const chapters = crawledInformation.chapters.map((chapter, index) => {
        const chapterEntity = new ChapterEntity();
        chapterEntity.title = 'Chapter ' + chapter.chapterNumber;
        chapterEntity.sourceUrl = chapter.href;
        chapterEntity.chapterNumber = chapter.chapterNumber;
        chapterEntity.position = length - index;
        chapterEntity.crawlStatus = CrawlingStatus.READY_FOR_CRAWL;
        chapterEntity.comic = comic;
        return chapterEntity;
      });

      // Save all chapters using queryRunner to maintain transaction
      comic.chapters = await queryRunner.manager.save(ChapterEntity, chapters);

      await queryRunner.commitTransaction();

      this.logger.log(`DONE [handleCrawlComic] with href=${href}`);
      return comic;
    } catch (e) {
      this.logger.error(e);
      await queryRunner.rollbackTransaction();
      throw e;
    }
  }

  private async getComicOrCrawlNew(href: string) {
    this.logger.log(`START [getIdOrCrawlNew] with href=${href}`);
    const crawledInformation = await this.extractInfo(href).catch((e) => {
      throw COMIC_NOT_FOUND_BY_URL;
    });
    const comic = await this.comicRepository.findOneBy({
      originId: crawledInformation.comicId,
    });
    if (!comic) {
      this.logger.log(
        `[getIdOrCrawlNew] not found comic by url try to pull new`
      );
      return this.pullNewComic(href, crawledInformation).then((r) => {
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
      .extract()
  }

  public async getComicByUrl(url: string) {
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
      return this.getComicOrCrawlNew(url).then(async (r) => {
        this.logger.log(`DONE [getComicByUrl]`);
        return ComicEntity.toJSONWithoutChapter(r);
      });
    }
    return ComicEntity.toJSONWithoutChapter(comic);
  }
}
