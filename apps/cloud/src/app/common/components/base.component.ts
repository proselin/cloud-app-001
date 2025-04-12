import { Directive, inject } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LoadingGlobalService } from '../../shared/services/loading';
import { ApiService } from '../../shared/services/api';

@Directive()
export abstract class BaseComponent {
  protected readonly notificationService = inject(NzNotificationService);
  protected readonly messageService = inject(NzMessageService);
  protected readonly loadingGlobalService = inject(LoadingGlobalService);
  protected readonly apiService = inject(ApiService);
}
