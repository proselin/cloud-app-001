import { Injectable, Logger } from '@nestjs/common';
import fs from 'node:fs';
import { Utils } from '../utils';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class FileIoService {
  private logger = new Logger('FileIoService');
  private saveImageDir = `${__dirname}/assets/images/`;

  async saveImageFile(fileName: string, buffer: Buffer) {
    this.logger.log(`START [saveImages] with filename=${fileName}`)
    if (!fs.existsSync(this.saveImageDir)) {
      await fs.promises.mkdir(this.saveImageDir);
    }
    return fs.promises.writeFile(this.saveImageDir + fileName, buffer);
  }

  async readImageFile(fileName: string): Promise<Buffer> {
    return fs.promises.readFile(this.saveImageDir + fileName);
  }

  generateFileName(prefixFileName: string, contentType: string | null) {
    if(!contentType) throw new RpcException("Content type must be a string");
    const extension = Utils.getFileExtensionFromContentType(contentType);
    if (!extension) {
      throw new RpcException('Unsupported content type');
    }
    const hash = Date.now().toString(3).substring(0, 3);
    return `${prefixFileName}-${hash}.${extension}`;
  }
}
