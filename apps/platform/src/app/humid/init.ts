import { ChildProcess, fork } from 'child_process';
import { join } from 'path';
import App from '../app';

export class HumidServiceProcess {
  private readonly instantProcess: ChildProcess;

  constructor() {
    if (App.isDevelopmentMode()) {
      this.instantProcess = fork(join('dist', 'apps', 'humid', 'main.js'), {
        execArgv: ['--inspect=5860'],
      });
    } else {
      this.instantProcess = fork(join('node_modules', 'humid', 'main.js'));
    }
  }
}
