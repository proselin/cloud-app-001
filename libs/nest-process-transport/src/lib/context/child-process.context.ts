import { BaseRpcContext } from '@nestjs/microservices';

type ChildProcessArgs = [typeof process, string, string | undefined];

export class ChildProcessContext extends BaseRpcContext<ChildProcessArgs> {
  constructor(args: ChildProcessArgs) {
    super(args);
  }

  getId() {
    return this.args[2];
  }

  getProcess() {
    return this.args[0];
  }

  getPattern() {
    return this.args[1];
  }
}
