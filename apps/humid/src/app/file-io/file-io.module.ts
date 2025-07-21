import { Global, Module } from '@nestjs/common';
import { FileIoService } from './file-io.service';
import {
  ServeStaticModule,
  ServeStaticModuleOptions,
} from '@nestjs/serve-static';
import { ConfigService } from '@nestjs/config';
import { FileIoController } from './file-io.controller';

@Global()
@Module({
  imports: [
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const enableCors = configService.get<boolean>('file.enable-cors', true);
        const allowedOrigins = configService.get<string>('file.cors-allowed-origins', 'http://localhost:4200');

        return [
          {
            rootPath: configService.getOrThrow('file.img-location'),
            serveRoot: '/static/imgs',
            serveStaticOptions: {
              setHeaders: (res) => {
                if (enableCors) {
                  // Parse multiple origins separated by comma
                  const origins = allowedOrigins.split(',').map(origin => origin.trim());

                  // For simplicity, use the first origin or * for multiple origins
                  const corsOrigin = origins.length === 1 ? origins[0] : '*';

                  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
                  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
                  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
                  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                }
                res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
              },
            },
          },
        ] as ServeStaticModuleOptions[];
      },
    }),
  ],
  controllers: [FileIoController],
  providers: [FileIoService],
  exports: [FileIoService],
})
export class FileIoModule {}
