import { Global, Module } from '@nestjs/common';
import { FileIoService } from './file-io.service';

@Global()
@Module({
  providers: [
    FileIoService,
  ],
  exports: [
    FileIoService,
  ]
})
export class FileIoModule {}
