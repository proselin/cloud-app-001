import { ChangeDetectionStrategy, Component } from '@angular/core';
import {BasePagesComponent} from '../../common/components';

@Component({
  selector: 'cloud-settings',
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  standalone : true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent extends BasePagesComponent{

}
