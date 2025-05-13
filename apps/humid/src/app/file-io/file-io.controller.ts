import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FileIoService } from './file-io.service';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { z } from 'zod';

@Controller()
export class FileIOController {
  constructor(private fileIoService: FileIoService) {}

  @MessagePattern('file:get-image')
  async getFile(
    @Payload('fileName', new ZodValidationPipe(z.string())) filename: string
  ): Promise<Buffer> {
    return this.fileIoService.readImageFile(filename);
  }
}
