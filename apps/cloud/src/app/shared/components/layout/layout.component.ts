import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { BaseComponent } from '../../../common/components';

@Component({
  selector: 'cloud-layout',
  imports: [
    HeaderComponent,
    FooterComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent extends BaseComponent {
  isSpinning = computed(() => this.loadingGlobalService.count() > 0);
}
