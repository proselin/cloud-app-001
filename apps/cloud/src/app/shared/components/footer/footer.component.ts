import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BaseComponent } from '../../../common/components';

@Component({
  selector: 'cloud-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent extends BaseComponent {}
