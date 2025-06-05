import { Injectable } from '@angular/core';
import { BaseIpcService } from '../../../common/services';
import { HumidIpcFunction } from '../../models/ipc';
import { ComicEntity } from '../../../common/models/comic-entity';
import { ResponseBuffer } from '../../../common/models/response.model';

export type SearchComicRes = (ComicEntity & {
  thumbImage: Required<ComicEntity['thumbImage']>;
})[];
export type pullComicRes = ComicEntity & {};
export type getImageFileRes = ResponseBuffer;

@Injectable({
  providedIn: 'root',
})
export class HumidIpcService extends BaseIpcService<HumidIpcFunction> {
  constructor() {
    super('cloudIpcHumid');
  }

  pullComicByUrl(comicUrl: string) {
    return this.send<pullComicRes>('pullComicByUrl', comicUrl);
  }

  searchComic(textSearch?: string) {
    return this.send<SearchComicRes>('searchComic', '');
  }

  getImageFile(fileName: string) {
    return this.send<getImageFileRes>('getImageFile', fileName);
  }
}
