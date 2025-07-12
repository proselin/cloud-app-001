import { Directive, inject, Injector } from '@angular/core';
import { LoadingGlobalService } from '../../shared/services/loading';
import { EnvironmentToken } from '../config/environment.token';

@Directive()
export abstract class BaseComponent {
  protected readonly injector = inject(Injector);
  protected readonly loadingGlobalService = inject(LoadingGlobalService);
  protected readonly env = inject(EnvironmentToken);
}
