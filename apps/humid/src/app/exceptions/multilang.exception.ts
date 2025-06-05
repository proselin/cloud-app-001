import { HttpException, HttpStatus } from '@nestjs/common';

export class MultilangException extends HttpException {
  constructor(error: object) {
    super(error, HttpStatus.BAD_REQUEST)
  }
}
