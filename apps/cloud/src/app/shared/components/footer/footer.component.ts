import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzFooterComponent } from 'ng-zorro-antd/layout';
import {BaseComponent} from '../../../common/components';

@Component({
  selector: 'cloud-footer',
  imports: [NzFooterComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  standalone : true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent extends BaseComponent {

}
