import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export const INTERNAL_SERVER_ERROR = new InternalServerErrorException(
  'Có lỗi xảy ra'
);

export const COMIC_NOT_FOUND = new NotFoundException('Không tìm thấy truyện');
export const COMIC_NOT_FOUND_BY_URL = new NotFoundException(
  'Không tìm thấy truyện theo URL'
);
