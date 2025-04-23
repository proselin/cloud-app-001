import { Injectable } from '@angular/core';
import { BaseIpcService } from '../../../common/services';
import { HumitIpcFunction } from '../../models/ipc/humit-ipc.types';

@Injectable({
  providedIn: 'root',
})
export class HumitIpcService extends BaseIpcService<HumitIpcFunction> {
  constructor() {
    super('cloudIpcHumit');
  }

  getComicByUrl(comicUrl: string) {
    return this.channel.getComicByUrl(comicUrl);
  }

  getAppVersion() {
    return this.channel.getAppVersion();
  }
}
