import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { NzContentComponent, NzLayoutComponent } from 'ng-zorro-antd/layout';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { BaseComponent } from '../../../common/components';

@Component({
  selector: 'cloud-layout',
  imports: [
    HeaderComponent,
    FooterComponent,
    NzLayoutComponent,
    NzContentComponent,
    BreadcrumbComponent,
    NzSpinComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent extends BaseComponent {
  isSpinning = computed(() => this.loadingGlobalService.count() > 0);
}
