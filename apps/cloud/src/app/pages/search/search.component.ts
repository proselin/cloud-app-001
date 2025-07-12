import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { BasePagesComponent } from '../../common/components';
import { FormsModule } from '@angular/forms';
import { ComicService } from '../../shared/services/comic.service';
import { SuggestComic } from '../../shared/models/api/comic.model';

@Component({
  selector: 'cloud-comic',
  imports: [FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent extends BasePagesComponent {
  private comicService = inject(ComicService);
  searchString = signal('');
  comics = signal<SuggestComic[]>([]);
  imageRaw = signal<Blob | null>(null);
  imageUrl = computed(() => {
    if (!this.imageRaw()) return null;
    return (URL || webkitURL).createObjectURL(this.imageRaw() as Blob);
  });

  async onSearch() {
    if (!this.searchString().trim()) {
      return;
    }

    this.loadingGlobalService
      .wrapLoading(this.comicService.getComicSuggestions(this.searchString()))
      .subscribe({
        next: (result) => {
          console.log('Search Response', result);
          this.comics.set(result || []);
        },
        error: (error) => {
          console.error('Search failed:', error);
          this.comics.set([]);
        }
      });
  }
}
