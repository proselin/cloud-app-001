import { HttpClient } from '@angular/common/http';
import { Directive, inject } from '@angular/core';
import {
  EnvironmentModel,
  EnvironmentToken,
} from '../config/environment.token';

@Directive()
export abstract class ApiCommonService {
  protected readonly httpClient: HttpClient = inject(HttpClient);
  protected readonly env: EnvironmentModel = inject(EnvironmentToken);
}
