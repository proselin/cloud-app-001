import { ChildProcess, fork } from 'child_process';
import { join, resolve } from 'path';

export class HumitServiceProcess {
  instantProcess: ChildProcess;

  constructor() {
    this.instantProcess = fork(join('dist', 'apps','humit', 'main.js'));
  }
}
