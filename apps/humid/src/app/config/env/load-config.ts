import { z } from 'zod';
import { Utils } from '../../utils';

const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
} as const;

export function loadConfig(
  config: Record<string, unknown>
): Record<string, unknown> {
  const appEnv = {
    node_env: z.enum([NODE_ENV.DEVELOPMENT, NODE_ENV.PRODUCTION]),
    'humid.server.host': z.string(),
    'humid.server.port': z.coerce.number().int().min(1).max(65535),
    'humid.server.prefix': z.string(),
    'humid.app.version': z.string().default('V1'),
    'humid.server.doc-prefix': z.string().default('swagger'),
  };

  const dbConfig = {
    'db.host': z.string().default('localhost'),
    'db.port': z.coerce.number().int().min(1).max(65535).default(5432),
    'db.username': z.string(),
    'db.password': z.string(),
    'db.database': z.string(),
    'db.ssl': z.coerce.boolean().default(false),
  };
  const fileIo = {
    'file.img-location': z.string().transform(Utils.fromConfigToPath),
    'file.cors-allowed-origins': z.string().default('http://localhost:4200'),
    'file.enable-cors': z.coerce.boolean().default(true),
  };

  const crawlingConfig = {
    'crawl.chapter.concurrency': z.coerce.number().int().min(1).max(10).default(1),
    'crawl.image.concurrency': z.coerce.number().int().min(1).max(10).default(1),
    'crawl.queue.log-level': z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  };

  return z
    .object({
      ...appEnv,
      ...dbConfig,
      ...fileIo,
      ...crawlingConfig,
    })
    .parse(config);
}
