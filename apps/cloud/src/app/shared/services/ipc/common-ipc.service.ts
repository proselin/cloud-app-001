import { Injectable } from '@angular/core';
import { BaseIpcService } from '../../../common/services/base-ipc.service';

@Injectable({
  providedIn: 'root'
})
export class CommonIpcService  extends BaseIpcService {

  constructor() {
    super('cloudIpcCommon')
  }

}
