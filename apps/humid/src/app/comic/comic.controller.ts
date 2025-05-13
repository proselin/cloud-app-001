import { Controller } from '@nestjs/common';
import { FileIoService } from '../file-io/file-io.service';
import { MessagePattern } from '@nestjs/microservices';
import { ComicService } from './comic.service';

@Controller('comic')
export class ComicController {
  constructor(
    private fileIoService: FileIoService,
    private comicService: ComicService,
  ) {}

  @MessagePattern('comic:search')
  public search(searchTerm: string) {
      return this.comicService.getAllComic()
  }

}
