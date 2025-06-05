import { ApiProperty } from '@nestjs/swagger';

export class ResponseMapper<T> {
  @ApiProperty({ description: 'Status code of the response', example: 200 })
  statusCode: number;

  @ApiProperty({ description: 'Response message', example: 'Success' })
  message: string;

  @ApiProperty({ description: 'Response data' })
  data: T;

  constructor(statusCode: number, message: string, data: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static success<T>(data: T, message = 'Success', statusCode = 200): ResponseMapper<T> {
    return new ResponseMapper<T>(statusCode, message, data);
  }

  static error<T>(message: string, statusCode = 400, error: T): ResponseMapper<T> {
    return new ResponseMapper<T>(statusCode, message, error);
  }
}
