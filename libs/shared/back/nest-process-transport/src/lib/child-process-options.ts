import { Logger, LoggerService } from '@nestjs/common';

export type ChildProcessOptions = {
  logger: Logger | LoggerService
}
