import { z } from 'zod';
import { Utils } from '../../utils';

const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
} as const;

export function loadConfig(config: Record<string, any>): Record<string, any> {
  const appEnv = {
    node_env: z.enum([NODE_ENV.DEVELOPMENT, NODE_ENV.PRODUCTION]),
    'humid.server.host': z.string(),
    'humid.server.port': z.coerce.number().int().min(1).max(65535),
    'humid.server.prefix': z.string(),
    'humid.app.version': z.string().default("V1"),
    'humid.server.doc-prefix': z.string().default("swagger"),
  };

  const dbConfig = {
    "db.location": z.string().transform(Utils.fromConfigToPath),
  }
  const fileIo = {
    "file.img-location": z.string().transform(Utils.fromConfigToPath),
  }

  return z
    .object({
      ...appEnv,
      ...dbConfig,
      ...fileIo
    })
    .parse(config);
}
