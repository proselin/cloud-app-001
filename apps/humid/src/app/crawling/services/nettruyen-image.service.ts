import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { NettruyenHttpService } from '../../http/nettruyen-http.service';
import { ImageEntity } from '../../entities/image.entity';
import { QueryRunner } from 'typeorm';
import { CrawlImageJobData } from '../../common';
import { ImageType } from '../../common/constant/image';
import { FileIoService } from '../../file-io/file-io.service';
import { ChapterEntity } from '../../entities/chapter.entity';
import { CrawlingQueueService } from './crawling-queue.service';

@Injectable()
export class NettruyenImageService {
  private logger = new Logger(NettruyenImageService.name);

  constructor(
    private storeService: FileIoService,
    private http: NettruyenHttpService,
    private crawlingQueue: CrawlingQueueService
  ) {}

  async handleCrawlThumb(data: CrawlImageJobData, queryRunner?: QueryRunner) {
    try {
      const fileName = await this.crawlAndSaveImage(
        `thumb-${data.comicId}`,
        data.dataUrls,
        data.domain
      );

      return this.createImage(
        {
          fileName,
          position: data.position,
          originUrls: data.dataUrls,
          type: data.type,
        },
        undefined,
        queryRunner
      );
    } catch (error) {
      this.logger.error(`ERROR [handleCrawlImage]`);
      this.logger.error(error);
      throw error;
    }
  }

  async handleCrawlImages(
    imagesRawData: CrawlImageJobData[],
    queryRunner?: QueryRunner
  ) {
    const results = [];

    for (const data of imagesRawData) {
      try {
        const result = await this.crawlingQueue.queueImageTask({
          id: `img-${data.chapterId}-${data.position}`,
          execute: async () => {
            const fileName = await this.crawlAndSaveImage(
              `img-${data.chapterId}`,
              data.dataUrls,
              data.domain
            );

            return this.createImage(
              {
                fileName,
                position: data.position,
                originUrls: data.dataUrls,
                type: data.type,
              },
              data.chapterId,
              queryRunner
            );
          }
        });

        results.push(result);
      } catch (error) {
        this.logger.error(`ERROR [handleCrawlImage]`);
        this.logger.error(error);
        results.push(undefined);
      }
    }

    return results.filter((item) => !!item);
  }

  private async createImage(
    storedImage: {
      fileName: string;
      originUrls: string[];
      position: number;
      type: ImageType;
    },
    chapterId?: number,
    queryRunner?: QueryRunner
  ) {
    try {
      this.logger.log(
        ` START [${this.createImage.name}]:  create image with file name ${storedImage.fileName}`
      );

      const image = new ImageEntity();
      image.fileName = storedImage.fileName;
      image.originUrls = JSON.stringify(storedImage.originUrls ?? []);
      image.position = storedImage.position;
      image.type = storedImage.type as number;

      await image.save();

      switch (true) {
        case !!chapterId: {
          const chapter = new ChapterEntity();
          chapter.id = chapterId;
          image.chapter = chapter;
          break;
        }
      }

      await queryRunner?.manager.save(ImageEntity, image);

      this.logger.log(
        `DONE [${this.createImage.name}]: create image with file name ${storedImage.fileName}`
      );
      return image;
    } catch (e) {
      this.logger.error(
        `ERROR [${this.createImage.name}]: Failed to create image with uploaded url `
      );
      this.logger.error(e);
      throw e;
    }
  }

  private async handleImageUrls(imageUrls: string[], domain: string) {
    try {
      this.logger.log(
        `START [handleImageUrls] with imageUrls=${imageUrls.join(
          ','
        )}, domain=${domain}`
      );
      let buffer: Buffer | null = null;
      let contentType: string | null = null;

      for (const url of imageUrls) {
        const response = await this.http
          .getImages(url, domain)
          .catch(() => null);
        if (!response) continue;
        buffer = response.data;
        contentType = response.headers['content-type'];
        if (buffer) break;
      }
      if (!buffer) {
        throw new Error(
          `Not result found on ${JSON.stringify(imageUrls)}`
        );
      }

      this.logger.log(
        `DONE [handleImageUrls] with imageUrls=${imageUrls.join(
          ','
        )}, domain=${domain}`
      );

      return {
        contentType,
        buffer,
      };
    } catch (e) {
      this.logger.error('ERROR [handleImageUrls]');
      this.logger.error(e);
      throw e;
    }
  }

  private async crawlAndSaveImage(
    prefixFileName: string,
    svUrls: string[],
    domain: string
  ) {
    this.logger.log(
      `START [crawlAndSaveImage] with svUrls=${JSON.stringify(
        svUrls
      )} domain=${domain} prefixFileName=${prefixFileName} `
    );
    try {
      const { buffer, contentType } = await this.handleImageUrls(
        svUrls,
        domain
      );
      const fileName = this.storeService.generateFileName(
        prefixFileName,
        contentType
      );
      await this.storeService.saveImageFile(fileName, buffer);
      this.logger.log(
        `DONE [crawlAndSaveImage] with svUrls=${JSON.stringify(
          svUrls
        )} domain=${domain} prefixFileName=${prefixFileName} `
      );
      return fileName;
    } catch (e) {
      this.logger.error(
        'ERROR [crawlAndSaveImage] Fail to Crawl and upload file'
      );
      this.logger.error(e);
      throw e;
    }
  }
}
