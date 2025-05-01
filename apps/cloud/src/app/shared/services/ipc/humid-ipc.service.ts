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

  pullComicByUrl(comicUrl: string) {
    return this.send<{ id: string }>('pullComicByUrl', comicUrl);
  }
}
