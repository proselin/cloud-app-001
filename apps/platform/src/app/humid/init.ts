import { fork, ChildProcess } from 'child_process';
import { join } from 'path';
import App from '../app';
import { ChildProcessClient } from '@cloud/libs/nest-process-transport';
import { HumidHandler } from './humid.handler';

export class HumidServiceProcess {
  private readonly instantProcess: ChildProcess;
  private handler: HumidHandler;
  client: ChildProcessClient;

  constructor() {
    if (App.isDevelopmentMode()) {
      this.instantProcess = fork(join('dist', 'apps', 'humid', 'main.js'), {
        execArgv: ['--inspect']
      });
    } else {
      this.instantProcess = fork(join('node_modules', 'humid', 'main.js'));
    }
    if (this.instantProcess) {
      this.client = new ChildProcessClient(this.instantProcess);
    }
    this.handler = new HumidHandler(this.client);
  }
}
