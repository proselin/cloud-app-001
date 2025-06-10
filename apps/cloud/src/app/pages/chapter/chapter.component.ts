import { ChangeDetectionStrategy, Component, inject, OnInit, signal, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BasePagesComponent } from '../../common/components';
import { MockDataService, ChapterDetailInfo, ChapterInfo } from '../../shared/services/mock';
import { ChapterService } from '../../shared/services';
import { ChapterPlainObject, ChapterNavigationResponseDto, MinimizeChapterResponseDto, ImagePlainObject } from '../../shared/models/api/chapter.model';
import { GsapAnimationService } from '../../shared/services/animation';

@Component({
  selector: 'cloud-chapter',
  imports: [CommonModule],
  templateUrl: './chapter.component.html',
  styleUrl: './chapter.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterComponent extends BasePagesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chapterContainer', { static: false }) chapterContainer!: ElementRef;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mockDataService = inject(MockDataService);
  private chapterService = inject(ChapterService);
  private gsapService = inject(GsapAnimationService);

  chapter = signal<ChapterDetailInfo | null>(null);
  allChapters = signal<ChapterInfo[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Image navigation properties
  currentImageIndex = signal<number>(0);

  comicId = '';
  chapterId = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.comicId = params['comicId'];
      this.chapterId = params['chapterId'];

      if (this.comicId && this.chapterId) {
        this.loadChapterDetail();
        this.loadChapterNavigation();
      }
    });
  }

  ngAfterViewInit() {
    // Add keyboard navigation
    document.addEventListener('keydown', this.handleKeyPress.bind(this));

    // Initialize animations when chapter data is loaded
    if (this.chapter()) {
      this.initializeAnimations();
    }
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyPress.bind(this));
  }

  private initializeAnimations() {
    // Animate entrance of navigation bars using slideInLeft/slideInRight as alternatives
    const topNav = document.querySelector('.top-nav-bar');
    if (topNav) {
      this.gsapService.slideInLeft(topNav, { delay: 0, duration: 0.5 });
    }

    const bottomNav = document.querySelector('.bottom-nav-bar');
    if (bottomNav) {
      this.gsapService.slideInRight(bottomNav, { delay: 0.1, duration: 0.5 });
    }

    // Animate keyboard shortcuts help
    const shortcuts = document.querySelector('.shortcuts-help');
    if (shortcuts) {
      this.gsapService.fadeIn(shortcuts, { delay: 0.3, duration: 0.3 });
    }

    // Stagger animate chapter images
    setTimeout(() => {
      const images = document.querySelectorAll('.chapter-image');
      if (images.length > 0) {
        this.gsapService.staggerIn(images, {
          duration: 0.3,
          stagger: 0.1,
          y: 30,
          opacity: 0
        });
      }
    }, 500);

    // Animate progress bar
    this.animateProgressBar();
  }

  private animateProgressBar() {
    // Since we show all images at once, we'll show 100% progress
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      this.gsapService.progressBar(progressBar, 100);
    }
  }

  private loadChapterDetail() {
    this.loading.set(true);
    this.error.set(null);

    // Try to fetch from real API first
    this.chapterService.getChapterDetail(this.chapterId).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          // Convert API response to ChapterDetailInfo format
          const convertedChapter = this.convertAPIChapterToChapterDetail(result.data);
          this.chapter.set(convertedChapter);
          // Initialize animations after data is loaded
          setTimeout(() => this.initializeAnimations(), 100);
          console.log('✅ Successfully loaded chapter detail from API:', result.data.title);
        } else {
          // Fallback to mock data if API returns empty
          this.loadMockChapterDetail();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.warn('⚠️ Chapter detail API request failed, falling back to mock data:', error);
        this.loadMockChapterDetail();
      }
    });
  }

  private loadMockChapterDetail() {
    this.mockDataService.getChapterDetail(this.comicId, this.chapterId).subscribe({
      next: (result) => {
        if (result.response) {
          this.chapter.set(result.response);
          // Initialize animations after data is loaded
          setTimeout(() => this.initializeAnimations(), 100);
          console.log('📝 Loaded mock chapter detail:', result.response.title);
        } else {
          this.error.set('Chapter not found');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading chapter detail:', error);
        this.error.set('Failed to load chapter details');
        this.loading.set(false);
      }
    });
  }

  private loadChapterNavigation() {
    // Use the minimized chapters endpoint which includes crawl status
    this.chapterService.getMinimizedChaptersByComic(this.comicId).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          // Convert API response to ChapterInfo format
          const convertedChapters: ChapterInfo[] = result.data.map(chapter =>
            this.convertAPIMinimizedChapterToChapterInfo(chapter)
          );
          this.allChapters.set(convertedChapters);
          console.log('✅ Successfully loaded chapter navigation from API:', result.data.length);
        } else {
          // Fallback to mock data if API returns empty
          this.loadMockChapterNavigation();
        }
      },
      error: (error) => {
        console.warn('⚠️ Chapter navigation API request failed, falling back to mock data:', error);
        this.loadMockChapterNavigation();
      }
    });
  }

  private loadMockChapterNavigation() {
    this.mockDataService.getChapterNavigation(this.comicId).subscribe({
      next: (result) => {
        if (result.response) {
          this.allChapters.set(result.response);
          console.log('📝 Loaded mock chapter navigation:', result.response.length);
        }
      },
      error: (error) => {
        console.error('Error loading chapter navigation:', error);
      }
    });
  }

  private convertAPIChapterToChapterDetail(apiChapter: ChapterPlainObject): ChapterDetailInfo {
    return {
      id: String(apiChapter.id),
      comicId: this.comicId, // Use the current comic ID
      title: apiChapter.title,
      chapterNumber: parseInt(apiChapter.chapterNumber),
      position: apiChapter.position,
      isCrawled: apiChapter.crawlStatus === 'DONE',
      imageCount: apiChapter.images?.length || 0,
      sourceUrl: apiChapter.sourceUrl,
      createdAt: new Date(apiChapter.createdAt),
      updatedAt: new Date(apiChapter.updatedAt),
      images: apiChapter.images?.map((image: ImagePlainObject) => ({
        id: String(image.id),
        fileName: image.fileName,
        position: image.position,
        url: `http://localhost:19202/static/imgs/${image.fileName}`
      })) || []
    };
  }

  private convertAPIChapterNavigationToChapterInfo(apiChapter: ChapterNavigationResponseDto): ChapterInfo {
    return {
      id: String(apiChapter.id),
      comicId: this.comicId, // Use the current comic ID
      title: apiChapter.title,
      chapterNumber: apiChapter.position, // Use position as chapter number
      position: apiChapter.position,
      isCrawled: true, // Assume chapters in navigation are available
      imageCount: 0, // Will be updated when we have detailed data
      sourceUrl: '', // Not available in navigation response
      createdAt: new Date(), // Placeholder
      updatedAt: new Date() // Placeholder
    };
  }

  private convertAPIMinimizedChapterToChapterInfo(apiChapter: MinimizeChapterResponseDto): ChapterInfo {
    return {
      id: String(apiChapter.id),
      comicId: this.comicId, // Use the current comic ID
      title: apiChapter.title,
      chapterNumber: parseInt(apiChapter.chapterNumber),
      position: apiChapter.position,
      isCrawled: apiChapter.crawlStatus === 'DONE', // Check actual crawl status
      imageCount: 0, // Will be updated when we have detailed data
      sourceUrl: apiChapter.sourceUrl || '', // Use sourceUrl if available
      createdAt: new Date(apiChapter.createdAt),
      updatedAt: new Date(apiChapter.updatedAt)
    };
  }

  private handleKeyPress(event: KeyboardEvent) {
    const chapter = this.chapter();
    if (!chapter) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.goToPreviousChapter();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.goToNextChapter();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.goToPreviousChapter();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.goToNextChapter();
        break;
      case 'Escape':
        event.preventDefault();
        this.goBackToComic();
        break;
    }
  }

  // Remove unused pagination methods - now we show all images at once

  private animateChapterTransition() {
    // Animate chapter navigation
    const container = document.querySelector('.chapter-container');
    if (container) {
      this.gsapService.chapterNavigation(container, 'next');
    }
  }

  goToNextChapter() {
    const chapters = this.allChapters();
    const currentChapter = this.chapter();
    if (!currentChapter || !chapters.length) return;

    const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
    if (currentIndex < chapters.length - 1) {
      const nextChapter = chapters[currentIndex + 1]; // Chapters are in ascending order
      if (nextChapter.isCrawled) {
        this.animateChapterTransition();
        setTimeout(() => {
          this.router.navigate(['/chapter', this.comicId, nextChapter.id]);
        }, 300);
      }
    }
  }

  goToPreviousChapter() {
    const chapters = this.allChapters();
    const currentChapter = this.chapter();
    if (!currentChapter || !chapters.length) return;

    const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
    if (currentIndex > 0) {
      const prevChapter = chapters[currentIndex - 1]; // Chapters are in ascending order
      if (prevChapter.isCrawled) {
        this.animateChapterTransition();
        setTimeout(() => {
          this.router.navigate(['/chapter', this.comicId, prevChapter.id]);
        }, 300);
      }
    }
  }

  goBackToComic() {
    this.router.navigate(['/comic', this.comicId]);
  }

  getCurrentChapterIndex(): number {
    const chapters = this.allChapters();
    const currentChapter = this.chapter();
    if (!currentChapter || !chapters.length) return -1;

    return chapters.findIndex(ch => ch.id === currentChapter.id) + 1;
  }

  hasNextChapter(): boolean {
    const chapters = this.allChapters();
    const currentChapter = this.chapter();
    if (!currentChapter || !chapters.length) return false;

    const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
    return currentIndex < chapters.length - 1 && chapters[currentIndex + 1].isCrawled;
  }

  hasPreviousChapter(): boolean {
    const chapters = this.allChapters();
    const currentChapter = this.chapter();
    if (!currentChapter || !chapters.length) return false;

    const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
    return currentIndex > 0 && chapters[currentIndex - 1].isCrawled;
  }

  getNextChapterTitle(): string {
    const chapters = this.allChapters();
    const currentChapter = this.chapter();
    if (!currentChapter || !chapters.length) return '';

    const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
    if (currentIndex < chapters.length - 1) {
      return chapters[currentIndex + 1].title;
    }
    return '';
  }

  getPreviousChapterTitle(): string {
    const chapters = this.allChapters();
    const currentChapter = this.chapter();
    if (!currentChapter || !chapters.length) return '';

    const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
    if (currentIndex > 0) {
      return chapters[currentIndex - 1].title;
    }
    return '';
  }

  // Image navigation methods
  nextImage() {
    const currentChapter = this.chapter();
    if (!currentChapter) return;

    const currentIndex = this.currentImageIndex();
    if (currentIndex < currentChapter.images.length - 1) {
      this.currentImageIndex.set(currentIndex + 1);
      this.scrollToCurrentImage();
    }
  }

  previousImage() {
    const currentIndex = this.currentImageIndex();
    if (currentIndex > 0) {
      this.currentImageIndex.set(currentIndex - 1);
      this.scrollToCurrentImage();
    }
  }

  onPageSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const pageIndex = parseInt(target.value, 10);
    this.currentImageIndex.set(pageIndex);
    this.scrollToCurrentImage();
  }

  private scrollToCurrentImage() {
    const currentIndex = this.currentImageIndex();
    const imageElement = document.querySelector(`[data-image-index="${currentIndex}"]`);
    if (imageElement) {
      imageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  getProgress(): number {
    // Since we show all images at once, return 100% progress
    return 100;
  }
}
