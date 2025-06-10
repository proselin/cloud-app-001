import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  AfterViewInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { BasePagesComponent } from '../../common/components';
import { MockDataService, SearchComicRes } from '../../shared/services/mock';
import { ComicService } from '../../shared/services/comic.service';
import { ImageComponent } from '../../shared/components/image/image.component';
import { ComicInfo } from '../../shared/models/types';
import { ComicPlainObject } from '../../shared/models/api/comic.model';
import { GsapAnimationService } from '../../shared/services/animation';

// Extended ComicInfo with API id
interface ExtendedComicInfo extends ComicInfo {
  id?: string;
}

@Component({
  selector: 'cloud-home',
  imports: [ImageComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent extends BasePagesComponent implements OnInit, AfterViewInit {
  @ViewChild('comicsContainer', { static: false }) comicsContainer!: ElementRef;

  private mockDataService = inject(MockDataService);
  private comicService = inject(ComicService);
  private router = inject(Router);
  private gsapService = inject(GsapAnimationService);

  comics = signal<SearchComicRes>([]);
  isLoadingFromAPI = signal<boolean>(false);

  ngOnInit() {
    this.onSearch();
  }

  ngAfterViewInit() {
    this.animatePageEntrance();
  }

  private animatePageEntrance() {
    const title = document.querySelector('.page-title');
    if (title) {
      this.gsapService.slideInLeft(title, { delay: 0.2 });
    }

    const subtitle = document.querySelector('.page-subtitle');
    if (subtitle) {
      this.gsapService.fadeIn(subtitle, { delay: 0.4, y: 20 });
    }

    this.animateComicCards();
  }

  private animateComicCards() {
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      const comicCards = document.querySelectorAll('.comic-card');
      if (comicCards.length > 0) {
        this.gsapService.staggerIn(comicCards, {
          duration: 0.6,
          stagger: 0.1,
          y: 50,
          opacity: 0
        });
      }
    });
  }

  async onSearch() {
    this.isLoadingFromAPI.set(true);

    try {
      const result = await this.comicService.searchComics({ page: 1, limit: 20 }).toPromise();

      this.isLoadingFromAPI.set(false);

      if (result?.success && result.data && result.data.length > 0) {
        const convertedComics = result.data.map(comic => this.convertAPIComicToComicInfo(comic));
        this.comics.set(convertedComics);
        this.animateComicCards();
        console.log('✅ Successfully loaded comics from API:', result.data.length);
      } else {
        this.loadMockData();
      }
    } catch (error) {
      this.isLoadingFromAPI.set(false);
      console.warn('⚠️ API request failed, falling back to mock data:', error);
      this.loadMockData();
    }
  }

  private loadMockData() {
    this.mockDataService.searchComic().subscribe({
      next: (result) => {
        if (result.response && result.response.length > 0) {
          this.comics.set(result.response);
          this.animateComicCards();
          console.log('📝 Loaded mock data comics:', result.response.length);
        } else {
          console.warn('No mock data available');
          this.comics.set([]);
        }
      },
      error: (error) => {
        console.error('Error loading comics:', error);
        this.comics.set([]);
      }
    });
  }

  private convertAPIComicToComicInfo(apiComic: ComicPlainObject): ExtendedComicInfo {
    const result: ExtendedComicInfo = {
      title: apiComic.title || 'Unknown Title',
      author: '', // Backend doesn't provide author in main comic object
      description: apiComic.description || 'No description available',
      url: apiComic.originId || '', // Use originId as URL fallback
      imageUrl: apiComic.thumbImage?.fileName || '',
      chapterCount: apiComic.chapterCount || 0
    };

    // Add optional fields when available
    if (apiComic.thumbImage?.fileName) {
      result.thumbImage = {
        fileName: apiComic.thumbImage.fileName
      };
    }

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

  onCardHover(event: MouseEvent, isHover: boolean) {
    const card = event.currentTarget as Element;
    if (!card) return;

    if (isHover) {
      this.gsapService.scaleHover(card, 1.05);
    } else {
      this.gsapService.scaleReset(card);
    }
  }

  private getComicIdFromTitle(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
