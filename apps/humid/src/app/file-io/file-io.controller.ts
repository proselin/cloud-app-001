import { Controller, Get, Param } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';

@Controller('/api/v1/file-io')
export class FileIoController {
  constructor(private readonly configService: ConfigService) {}

  @Get('/saved-file-path')
  async getImage(): Promise<string> {
    return this.configService.getOrThrow<string>('file.img-location');
  }
}
