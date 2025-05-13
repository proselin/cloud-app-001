import { RpcException } from '@nestjs/microservices';

export class MultilangException extends RpcException {
  constructor(error: object) {
    super(error)
  }
}
