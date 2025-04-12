import { ChangeDetectionStrategy, Component } from '@angular/core';
import {BasePagesComponent} from '../../common/components';

@Component({
  selector: 'cloud-search',
  imports: [],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  standalone : true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent extends BasePagesComponent{

  sayHello() {
    this.apiService.sayHello();
  }
}
