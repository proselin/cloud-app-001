

// Extended ComicInfo with API id
import { ComicInfo } from '../../shared/models/types';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ElementRef,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePagesComponent } from '../../common/components';
import { ComicService } from '../../shared/services';
import { ComicPlainObject } from '../../shared/models/api';
import { generateImageLink } from '../../common/utils/functions';
import {
  trigger,
  style,
  transition,
  animate,
  query,
  stagger
} from '@angular/animations';
import { Subject, firstValueFrom } from 'rxjs';

interface ExtendedComicInfo extends ComicInfo {
  id?: string;
  createdAt?: Date;
  tags?: string[];
}

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'cloud-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('pageTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('heroAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('800ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('staggerText', [
      transition(':enter', [
        query('h1, p', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(200, [
            animate('600ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('searchBarAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms 300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('categoryAnimation', [
      transition(':enter', [
        query('button', [
          style({ opacity: 0, transform: 'scale(0.8)' }),
          stagger(100, [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('sectionAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(40px)' }),
        animate('500ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ])
    ]),
    trigger('gridAnimation', [
      transition('* => *', [
        query('.group:enter', [
          style({ opacity: 0, transform: 'scale(0.8) translateY(40px)' }),
          stagger(50, [
            animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('cardStagger', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('{{delay}}ms 400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ], { params: { delay: 0 } })
    ]),
    trigger('loadingAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('emptyStateAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('500ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class HomeComponent extends BasePagesComponent implements OnInit, OnDestroy {
  private comicService = inject(ComicService);
  private destroy$ = new Subject<void>();

  @ViewChild('comicsContainer', { static: false }) comicsContainer!: ElementRef;

  // Core state
  comics = signal<ExtendedComicInfo[]>([]);
  isLoadingFromAPI = signal<boolean>(false);
  searchTerm = signal<string>('');
  viewMode = signal<ViewMode>('grid');

  // Featured content
  featuredCategories = ['Action', 'Adventure', 'Fantasy', 'Romance', 'Sci-Fi', 'Horror'];

  // Computed properties
  featuredComics = computed(() => {
    return this.comics().slice(0, 6); // First 6 comics as featured
  });

  displayedComics = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const filtered = term
      ? this.comics().filter(comic =>
          comic.title.toLowerCase().includes(term) ||
          comic.description?.toLowerCase().includes(term)
        )
      : this.comics();

    return filtered;
  });

  ngOnInit() {
    this.onSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Premium UI Methods
  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  setViewMode(mode: ViewMode) {
    this.viewMode.set(mode);
  }

  getGridClasses(): string {
    const baseClasses = 'transition-all duration-500';

    if (this.viewMode() === 'list') {
      return `${baseClasses} grid grid-cols-1 gap-6`;
    }

    // Grid mode with responsive columns
    return `${baseClasses} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 lg:gap-8`;
  }

  getImageContainerClasses(): string {
    const baseClasses = 'relative overflow-hidden';

    if (this.viewMode() === 'list') {
      return `${baseClasses} w-32 h-40 rounded-xl flex-shrink-0`;
    }

    return `${baseClasses} aspect-[3/4] rounded-xl`;
  }

  getContentClasses(): string {
    const baseClasses = 'p-4';

    if (this.viewMode() === 'list') {
      return `${baseClasses} flex-1`;
    }

    return baseClasses;
  }

  getTitleClasses(): string {
    if (this.viewMode() === 'list') {
      return 'text-lg';
    }

    return 'text-base';
  }

  getReadingProgress(comic: ExtendedComicInfo): number {
    // Mock reading progress based on comic ID - in real app, this would come from user data
    const seed = comic.id ? parseInt(comic.id, 10) : comic.title.length;
    return Math.min(95, (seed * 7) % 100);
  }

  isComicNew(comic: ExtendedComicInfo): boolean {
    if (!comic.createdAt) return false;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return comic.createdAt > oneWeekAgo;
  }

  onImageError(event: Event) {
    //handle image error
  }

  async onSearch() {
    this.isLoadingFromAPI.set(true);

    try {
      const result = await firstValueFrom(this.comicService.searchComics({ page: 1, limit: 20 }));

      this.isLoadingFromAPI.set(false);

      if (result?.data?.data && Array.isArray(result.data.data)) {
        const convertedComics = result.data.data.map(comic => this.convertAPIComicToComicInfo(comic));
        this.comics.set(convertedComics);
        console.log('✅ Successfully loaded comics from API:', result.data.data.length);
      }
    } catch (error) {
      this.isLoadingFromAPI.set(false);
      console.error('Failed to load comics:', error);
      this.comics.set([]);
    }
  }

  private convertAPIComicToComicInfo(apiComic: ComicPlainObject): ExtendedComicInfo {
    const result: ExtendedComicInfo = {
      title: apiComic.title || 'Unknown Title',
      author: '', // Backend doesn't provide author in main comic object
      description: apiComic.description || 'No description available',
      url: apiComic.originId || '', // Use originId as URL fallback
      imageUrl: generateImageLink(this.env.staticImgsUrl, apiComic.thumbImage?.fileName),
      chapterCount: apiComic.chapterCount || 0,
      createdAt: apiComic.createdAt ? new Date(apiComic.createdAt) : new Date(),
      tags: ['Action', 'Adventure'] // Mock tags - would come from API in real app
    };

    // Add frontend-specific ID
    if (apiComic.id) {
      result.id = String(apiComic.id);
    }

    return result;
  }

  navigateToComic(comic: ExtendedComicInfo) {
    if (!comic) return;

    const comicId = comic.id || this.getComicIdFromTitle(comic.title);
    this.router.navigate(['/comic', comicId]);
  }

  private getComicIdFromTitle(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
