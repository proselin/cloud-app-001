import { fork, ChildProcess } from 'child_process';
import { join } from 'path';

export class HumidServiceProcess {
  instantProcess: ChildProcess;

  constructor() {
    this.instantProcess = fork(join('node_modules', 'humid', 'main.js'));
  }
}
