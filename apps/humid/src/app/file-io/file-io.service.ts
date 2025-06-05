import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import fs from 'node:fs';
import { Utils } from '../utils';
import { ConfigService } from '@nestjs/config';
import {resolve} from "node:path";

@Injectable()
export class FileIoService {
  constructor(private configService: ConfigService) {}

  private logger = new Logger('FileIoService');
  private saveImageDir =
    this.configService.getOrThrow<string>('file.img-location');

  async saveImageFile(fileName: string, buffer: Buffer) {
    this.logger.log(`START [saveImages] with filename=${fileName}`);
    if (!fs.existsSync(this.saveImageDir)) {
      await fs.promises.mkdir(this.saveImageDir);
    }
    return fs.promises.writeFile(resolve(this.saveImageDir, fileName), buffer);
  }

  async readImageFile(fileName: string): Promise<Buffer> {
    return fs.promises.readFile(this.saveImageDir + fileName);
  }

  generateFileName(prefixFileName: string, contentType: string | null) {
    if (!contentType) throw new BadRequestException('Content type must be a string');
    const extension = Utils.getFileExtensionFromContentType(contentType);
    if (!extension) {
      throw new BadRequestException('Unsupported content type');
    }
    const hash = Date.now().toString(3).substring(0, 3);
    return `${prefixFileName}-${hash}.${extension}`;
  }
}
