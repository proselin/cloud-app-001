import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { BasePagesComponent } from '../../common/components';
import { NzDividerComponent } from 'ng-zorro-antd/divider';
import { NzColDirective, NzRowDirective } from 'ng-zorro-antd/grid';
import {
  getImageFileRes,
  HumidIpcService,
  SearchComicRes,
} from '../../shared/services/ipc/humid-ipc.service';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzListComponent, NzListItemComponent } from 'ng-zorro-antd/list';
import { ConvertUtils } from '../../common/utils/convert.utils';
import { MimeTypes } from '../../common/variables/mimetype';
import { ResponseBuffer } from '../../common/models/response.model';
import { ImageComponent } from '../../shared/components/image/image.component';

@Component({
  selector: 'cloud-home',
  imports: [
    NzDividerComponent,
    NzRowDirective,
    NzColDirective,
    NzCardComponent,
    NzListComponent,
    NzListItemComponent,
    ImageComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent extends BasePagesComponent implements OnInit {
  private humidIpcService = inject(HumidIpcService);
  comics = signal<SearchComicRes>([]);

  ngOnInit() {
    this.onSearch();
  }

  async onSearch() {
    this.loadingGlobalService
      .wrapLoading(this.humidIpcService.searchComic())
      .subscribe({
        next: (result) => {
          if (result.error) {
            throw result.error;
          }
          if (result.response) {
            this.comics.set(result.response);
          }
        },
      });
  }
}
