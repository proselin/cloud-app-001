import { ChildProcess, fork } from 'child_process';
import { join } from 'path';
import App from '../app';
import { ChildProcessClient } from '@cloud/libs/nest-process-transport';
import { HumidHandler } from './humid.handler';
import { pino } from 'pino';

export class HumidServiceProcess {
  private readonly instantProcess: ChildProcess;
  private handler: HumidHandler;
  client: ChildProcessClient;

  constructor() {
    if (App.isDevelopmentMode()) {
      this.instantProcess = fork(join('dist', 'apps', 'humid', 'main.js'), {
        execArgv: ['--inspect=5860'],
      });
    } else {
      this.instantProcess = fork(join('node_modules', 'humid', 'main.js'));
    }
    if (this.instantProcess) {
      const logger = pino()
      this.client = new ChildProcessClient(this.instantProcess, {
        logger: console,
      });
    }
    this.handler = new HumidHandler(this.client);
  }
}
