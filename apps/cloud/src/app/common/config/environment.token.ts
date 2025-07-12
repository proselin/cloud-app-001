import { InjectionToken } from '@angular/core';

export interface EnvironmentModel {
  apiUrl: string;
  staticImgsUrl: string;
  production: boolean;
}

export const EnvironmentToken = new InjectionToken<EnvironmentModel>('App configuration via environment //ps: Pls config environment file');

export function provideEnvironment(environment: EnvironmentModel) {
  return {
    provide: EnvironmentToken,
    useValue: environment,
  };
}
