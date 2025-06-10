import { ChangeDetectionStrategy, Component, inject, OnInit, signal, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BasePagesComponent } from '../../common/components';
import { MockDataService, ComicDetailInfo, ChapterInfo } from '../../shared/services/mock';
import { ComicService, ChapterService } from '../../shared/services';
import { ImageComponent } from '../../shared/components/image/image.component';
import { GsapAnimationService } from '../../shared/services/animation';
import { ComicPlainObject } from '../../shared/models/api/comic.model';

@Component({
  selector: 'cloud-comic',
  imports: [CommonModule, ImageComponent],
  templateUrl: './comic.component.html',
  styleUrl: './comic.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComicComponent extends BasePagesComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mockDataService = inject(MockDataService);
  private comicService = inject(ComicService);
  private chapterService = inject(ChapterService);
  private gsapService = inject(GsapAnimationService);

  comic = signal<ComicDetailInfo | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  isLoadingFromAPI = signal<boolean>(false);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const comicId = params['id'];
      if (comicId) {
        this.loadComicDetail(comicId);
      }
    });
  }

  ngAfterViewInit() {
    // Animate page entrance after view is initialized
    this.animatePageEntrance();
  }

  private animatePageEntrance() {
    // Animate back button
    const backButton = document.querySelector('.back-button');
    if (backButton) {
      this.gsapService.slideInLeft(backButton, { delay: 0.1 });
    }

    // Animate comic cover image
    const coverImage = document.querySelector('.cover-image');
    if (coverImage) {
      this.gsapService.fadeIn(coverImage, { delay: 0.3, duration: 0.8 });
    }

    // Animate comic info
    const comicInfo = document.querySelector('.comic-info');
    if (comicInfo) {
      this.gsapService.slideInRight(comicInfo, { delay: 0.4 });
    }

    // Animate chapter list
    setTimeout(() => {
      const chapterItems = document.querySelectorAll('.chapter-item');
      if (chapterItems.length > 0) {
        this.gsapService.staggerIn(chapterItems, {
          duration: 0.5,
          stagger: 0.05,
          y: 30,
          opacity: 0
        });
      }
    }, 500);
  }

  private loadComicDetail(comicId: string) {
    this.loading.set(true);
    this.error.set(null);
    this.isLoadingFromAPI.set(true);

    // Try to fetch from real API first
    this.comicService.getComicDetail(comicId).subscribe({
      next: (result) => {
        this.isLoadingFromAPI.set(false);
        if (result.success && result.data) {
          // Convert API response to ComicDetailInfo format
          const convertedComic = this.convertAPIComicToComicDetail(result.data);
          this.comic.set(convertedComic);
          setTimeout(() => this.animatePageEntrance(), 100);
          console.log('✅ Successfully loaded comic detail from API:', result.data.title);
        } else {
          // Fallback to mock data if API returns empty
          this.loadMockComicDetail(comicId);
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.isLoadingFromAPI.set(false);
        console.warn('⚠️ Comic detail API request failed, falling back to mock data:', error);
        this.loadMockComicDetail(comicId);
      }
    });
  }

  private loadMockComicDetail(comicId: string) {
    this.mockDataService.getComicDetail(comicId).subscribe({
      next: (result) => {
        if (result.response) {
          this.comic.set(result.response);
          // Trigger animations after data loads
          setTimeout(() => this.animatePageEntrance(), 100);
          console.log('📝 Loaded mock comic detail:', result.response.title);
        } else {
          this.error.set('Comic not found');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading comic detail:', error);
        this.error.set('Failed to load comic details');
        this.loading.set(false);
      }
    });
  }

  private convertAPIComicToComicDetail(apiComic: ComicPlainObject): ComicDetailInfo {
    const result: ComicDetailInfo = {
      id: String(apiComic.id), // Convert number to string for frontend
      title: apiComic.title,
      author: '', // Backend doesn't have author field in main comic object
      description: apiComic.description,
      url: apiComic.originId || '', // Use originId as URL fallback
      imageUrl: apiComic.thumbImage?.fileName || '',
      status: apiComic.status,
      chapterCount: apiComic.chapterCount,
      tags: [], // Backend doesn't have tags in main response
      chapters: [],
      createdAt: new Date(apiComic.createdAt),
      updatedAt: new Date(apiComic.updatedAt)
    };

    // Add optional thumbImage
    if (apiComic.thumbImage) {
      result.thumbImage = {
        fileName: apiComic.thumbImage.fileName
      };
    }

    // Convert chapters
    if (apiComic.chapters) {
      result.chapters = apiComic.chapters.map(chapter => ({
        id: String(chapter.id),
        comicId: String(apiComic.id),
        chapterNumber: parseInt(chapter.chapterNumber),
        title: chapter.title,
        position: chapter.position,
        isCrawled: chapter.crawlStatus === 'DONE', // Check if crawl is complete
        imageCount: 0, // Will be updated when we have image data
        sourceUrl: chapter.sourceUrl,
        createdAt: new Date(chapter.createdAt),
        updatedAt: new Date(chapter.updatedAt)
      }));
    }

    return result;
  }

  navigateToChapter(chapter: ChapterInfo) {
    const comic = this.comic();
    if (comic && chapter.isCrawled) {
      // Add chapter transition animation
      const chapterElement = event?.target as Element;
      const chapterItem = chapterElement?.closest('.chapter-item');
      if (chapterItem) {
        this.gsapService.scaleHover(chapterItem, 1.02);
      }

      setTimeout(() => {
        this.router.navigate(['/chapter', comic.id, chapter.id]);
      }, 150);
    }
  }

  onChapterHover(event: MouseEvent, isHover: boolean) {
    const chapterItem = event.currentTarget as Element;
    if (isHover) {
      this.gsapService.scaleHover(chapterItem, 1.02);
    } else {
      this.gsapService.scaleReset(chapterItem);
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'ongoing': return 'text-blue-600 bg-blue-100';
      case 'hiatus': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getCrawlStatusText(chapter: ChapterInfo): string {
    return chapter.isCrawled ? `${chapter.imageCount} pages` : 'Not crawled';
  }

  getCrawledChaptersCount(): number {
    const comic = this.comic();
    return comic ? comic.chapters.filter(ch => ch.isCrawled).length : 0;
  }

  getTotalPagesCount(): number {
    const comic = this.comic();
    return comic ? comic.chapters.reduce((sum, ch) => sum + ch.imageCount, 0) : 0;
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
