import { Injectable, Logger } from '@nestjs/common';
import { StoreService } from './store.service';
import { NettruyenHttpService } from './nettruyen-http.service';
import { ImageEntity } from '../../entities/image';
import { QueryRunner } from 'typeorm';
import { CrawlImageJobData } from '../../common';
import { ImageType } from '../../common/constant/image';

@Injectable()
@Injectable()
export class ImageService {
  private logger = new Logger(ImageService.name);

  constructor(
    private storeService: StoreService,
    private http: NettruyenHttpService
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
        data.comicId,
        null,
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
    return Promise.all(
      imagesRawData.map(async (data) => {
        try {
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
            null,
            data.chapterId,
            queryRunner
          );
        } catch (error) {
          this.logger.error(`ERROR [handleCrawlImage]`);
          this.logger.error(error);
        }
      })
    );
  }

  private async createImage(
    storedImage: {
      fileName: string;
      originUrls: string[];
      position: number;
      type: ImageType;
    },
    comicId?: number,
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
      image.chapter = {
        id: chapterId,
      };
      image.comic = {
        id: comicId,
      };
      await queryRunner.manager.save(image);

      this.logger.log(
        `DONE [${this.createImage.name}]: create image with file name ${storedImage.fileName}`
      );
      return image.id;
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
        throw new Error(`Not result found on ${JSON.stringify(imageUrls)}`);
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
      await this.storeService.saveImages(fileName, buffer);
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

