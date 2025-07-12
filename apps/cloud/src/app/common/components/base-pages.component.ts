import { BaseComponent } from './base.component';
import { Directive, inject } from '@angular/core';
import { mobileCheck } from '../utils/check-device';
import { ActivatedRoute, Router } from '@angular/router';

@Directive()
export abstract class BasePagesComponent extends BaseComponent {
  protected isMobile = mobileCheck();
  protected route = inject(ActivatedRoute);
  protected router = inject(Router);
}
