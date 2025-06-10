import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BaseComponent } from '../../../common/components';

@Component({
  selector: 'cloud-breadcrumb',
  imports: [],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent extends BaseComponent {}
