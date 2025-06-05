import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { BasePagesComponent } from '../../common/components';
import { FormsModule } from '@angular/forms';

import {
  HumidIpcService,
  SearchComicRes,
} from '../../shared/services/ipc/humid-ipc.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'cloud-comic',
  imports: [FormsModule, NzButtonModule, NzInputModule, NzIconModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent extends BasePagesComponent {
  private humidIpcService = inject(HumidIpcService);
  searchString = signal('');
  comics = signal<SearchComicRes>([]);
  imageRaw = signal<Blob | null>(null);
  imageUrl = computed(() => {
    if (!this.imageRaw()) return null;
    return (URL || webkitURL).createObjectURL(this.imageRaw() as Blob);
  });

  async onSearch() {
    this.loadingGlobalService
      .wrapLoading(this.humidIpcService.pullComicByUrl(this.searchString()))
      .subscribe({
        next: (result) => {
          console.log('Response', result);
        },
      });
  }
}
