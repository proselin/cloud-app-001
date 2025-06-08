import { Injectable } from '@angular/core';
import { BaseIpcService } from '../../../common/services';

@Injectable({
  providedIn: 'root',
})
export class CommonIpcService extends BaseIpcService<Record<string, string>> {
  constructor() {
    super('cloudIpcCommon');
  }
}
