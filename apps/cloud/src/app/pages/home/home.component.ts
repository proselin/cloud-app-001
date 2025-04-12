import { ChangeDetectionStrategy, Component } from '@angular/core';
import {BasePagesComponent} from '../../common/components';
import {NzCarouselComponent, NzCarouselContentDirective} from 'ng-zorro-antd/carousel';
import {NzDividerComponent} from 'ng-zorro-antd/divider';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {ComicCardComponent} from '../../shared/components/comic-card';
import {ComicInfo} from '../../shared/models/types/comic-info';

@Component({
  selector: 'cloud-home',
  imports: [
    NzCarouselComponent,
    NzCarouselContentDirective,
    NzDividerComponent,
    NzRowDirective,
    NzColDirective,
    ComicCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone : true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends BasePagesComponent{
  array = [1, 2, 3, 4];

  mockComicInfo: ComicInfo = {
    title: "OKe",
    url: "123123",
    author:"123123",
    description: "123123",
    imageUrl: "123123123"
  }
}
