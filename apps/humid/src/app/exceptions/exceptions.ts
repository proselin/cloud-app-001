import { RpcException } from '@nestjs/microservices';

export const INTERNAL_SERVER_ERROR = new RpcException('Có lỗi xảy ra');

export const COMIC_NOT_FOUND = new RpcException("Không tìm thấy truyện")
export const COMIC_NOT_FOUND_BY_URL = new RpcException("Không tìm thấy truyện theo URL")
