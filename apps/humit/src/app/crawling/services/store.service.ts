import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import { Utils } from '../../utils';
import { nanoid } from 'nanoid';

@Injectable()
export class StoreService {
  private saveImageDir = `${__dirname}/assets/images/`;

  async saveImages(fileName: string, buffer: Buffer) {
    if(!fs.existsSync(this.saveImageDir)) {
      await fs.promises.mkdir(this.saveImageDir);
    }
    return fs.promises.writeFile(this.saveImageDir + fileName, buffer)
  }

  async readImageFile(fileName: string): Promise<Buffer> {
    return fs.promises.readFile(this.saveImageDir + fileName);
  }

  generateFileName(prefixFileName: string, contentType: string) {
    const extension = Utils.getFileExtensionFromContentType(contentType);
    if (!extension) {
      throw new Error('Unsupported content type');
    }
    const hash = nanoid(3);
    return `${prefixFileName}-${hash}.${extension}`;
  }
}
