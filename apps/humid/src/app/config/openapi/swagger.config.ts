import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";

export function setupOpenApi(app: INestApplication) {
  const configEnv = app.get(ConfigService);
  if (configEnv.getOrThrow('humid.server.doc-prefix', 'swagger')) {
    const config = new DocumentBuilder()
      .setTitle('API Document')
      .setVersion(configEnv.getOrThrow('humid.app.version') as string)
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(
      configEnv.getOrThrow('humid.server.doc-prefix', 'swagger'),
      app,
      document
    );
  }
}
