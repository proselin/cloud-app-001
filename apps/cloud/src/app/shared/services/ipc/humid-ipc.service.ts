import { Injectable } from '@angular/core';
import { BaseIpcService } from '../../../common/services';
import { HumidIpcFunction } from '../../models/ipc';

@Injectable({
  providedIn: 'root',
})
export class HumidIpcService extends BaseIpcService<HumidIpcFunction> {
  constructor() {
    super('cloudIpcHumid');
  }

  getComicByUrl(comicUrl: string) {
    return this.channel.getComicByUrl(comicUrl);
  }

  getAppVersion() {
    return this.channel.getAppVersion();
  }
}
