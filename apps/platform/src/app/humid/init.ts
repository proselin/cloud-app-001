import { fork, ChildProcess } from 'child_process';
import { join } from 'path';
import App from '../app';
import { ChildProcessClient } from '@cloud/nest-process-transport';

export class HumidServiceProcess {
  private instantProcess: ChildProcess;
  client: ChildProcessClient

  constructor() {
    if(App.isDevelopmentMode()) {
      this.instantProcess = fork(join('dist','apps', 'humid', 'main.js'));
    }else {
      this.instantProcess = fork(join('node_modules', 'humid', 'main.js'));
    }
    if(this.instantProcess) {
      this.client = new ChildProcessClient(this.instantProcess);
    }
  }
}
