import { Directive, inject, Injector } from '@angular/core';
import { LoadingGlobalService } from '../../shared/services/loading';

@Directive()
export abstract class BaseComponent {
  protected readonly injector = inject(Injector);
  protected readonly loadingGlobalService = inject(LoadingGlobalService);
}
