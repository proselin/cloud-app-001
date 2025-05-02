import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { FileIoService } from './file-io.service';

@Controller()
export class FileIOController {

  constructor(private fileIoService: FileIoService) {
  }

  @MessagePattern()
  getFile(fileName: string): Promise<Buffer> {
    return this.fileIoService.readImageFile(fileName);
  }
}
