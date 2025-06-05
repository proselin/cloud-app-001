import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzBreadCrumbComponent } from 'ng-zorro-antd/breadcrumb';
import { BaseComponent } from '../../../common/components';

@Component({
  selector: 'cloud-breadcrumb',
  imports: [NzBreadCrumbComponent],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent extends BaseComponent {}
