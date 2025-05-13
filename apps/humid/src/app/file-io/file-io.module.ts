import { Global, Module } from '@nestjs/common';
import { FileIoService } from './file-io.service';
import { FileIOController } from './file-io.controller';

@Global()
@Module({
  controllers: [
    FileIOController
  ],
  providers: [
    FileIoService,
  ],
  exports: [
    FileIoService,
  ]
})
export class FileIoModule {}
