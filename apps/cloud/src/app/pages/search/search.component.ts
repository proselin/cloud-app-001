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
  MockDataService,
  SearchComicRes,
} from '../../shared/services/mock';

@Component({
  selector: 'cloud-comic',
  imports: [FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent extends BasePagesComponent {
  private mockDataService = inject(MockDataService);
  searchString = signal('');
  comics = signal<SearchComicRes>([]);
  imageRaw = signal<Blob | null>(null);
  imageUrl = computed(() => {
    if (!this.imageRaw()) return null;
    return (URL || webkitURL).createObjectURL(this.imageRaw() as Blob);
  });

  async onSearch() {
    this.loadingGlobalService
      .wrapLoading(this.mockDataService.pullComicByUrl(this.searchString()))
      .subscribe({
        next: (result) => {
          console.log('Response', result);
          this.comics.set(result.response || []);
        },
      });
  }
}
