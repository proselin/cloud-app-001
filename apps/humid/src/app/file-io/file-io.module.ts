import { Global, Module } from '@nestjs/common';
import { FileIoService } from './file-io.service';
import {
  ServeStaticModule,
  ServeStaticModuleOptions,
} from '@nestjs/serve-static';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return [
          {
            rootPath: configService.getOrThrow('file.img-location'),
            serveRoot: '/static/imgs',
          },
        ] as ServeStaticModuleOptions[];
      },
    }),
  ],
  providers: [FileIoService],
  exports: [FileIoService],
})
export class FileIoModule {}
