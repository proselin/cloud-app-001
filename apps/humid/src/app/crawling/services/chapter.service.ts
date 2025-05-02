import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ComicEntity } from '../../entities/comic';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { ChapterEntity } from '../../entities/chapter';
import { NettruyenHttpService } from './nettruyen-http.service';
import {
  CrawlChapterData,
  CrawlImageJobData,
  CrawlingStatus,
  ExtractChapterInfoResult$1,
  ExtractChapterInfoResultItem$1,
} from '../../common';
import { ImageType } from '../../common/constant/image';
import { ImageService } from './image.service';

@Injectable()
export class ChapterService {
  private readonly logger = new Logger(ChapterService.name);

  constructor(
    @InjectRepository(ComicEntity)
    private comicRepository: Repository<ComicEntity>,
    private dataSource: DataSource,
    private imageService: ImageService,
    private readonly http: NettruyenHttpService
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

      chapter.images = await this.imageService.handleCrawlImages(requestImages, queryRunner).then(r => {
        return r.filter(item => !!item)
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
