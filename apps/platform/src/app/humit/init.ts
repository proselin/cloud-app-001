import { ChildProcess, fork } from 'child_process';
import { resolve } from 'path';

export class HumitServiceProcess {
  instantProcess: ChildProcess;

  constructor() {
    this.instantProcess = fork(resolve('..', 'humit', 'main.js'));
  }
}
