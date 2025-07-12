import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BasePagesComponent } from '../../common/components';
import { ChapterService } from '../../shared/services';
import {
  ChapterDetailInfo,
  ChapterInfo,
  ChapterPlainObject,
  ImagePlainObject,
  MinimizeChapterResponseDto,
} from '../../shared/models/api';
import { tap } from 'rxjs';
import { CrawlStatus } from '../../common/variables/crawlStatus';

@Component({
  selector: 'cloud-chapter',
  imports: [CommonModule, FormsModule],
  templateUrl: './chapter.component.html',
  styleUrl: './chapter.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChapterComponent
  extends BasePagesComponent
  implements OnInit, OnDestroy
{
  private chapterService = inject(ChapterService);

  chapter = signal<ChapterDetailInfo | null>(null);
  allChapters = signal<ChapterInfo[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  chapterIndexed = signal<number>(-1);

  comicId!: number;
  chapterId!: number;
  comicName = signal<string>('');

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.comicId = params['comicId'];
      this.chapterId = params['chapterId'];

      if (this.comicId && this.chapterId) {
        this.loadChapterNavigation$().subscribe(() => {
          this.loadChapterDetail();
        });
      }
    });

    // Add simple keyboard navigation
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyPress.bind(this));
  }

  private handleKeyPress(event: KeyboardEvent) {
    switch (event.key) {
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

  private loadChapterNavigation$() {
    return this.chapterService.getMinimizedChaptersByComic(this.comicId).pipe(
      tap((response) => {
        const chapters = response.data;
        const chapterInfos = chapters.map((chapter) =>
          this.convertAPIMinimizedChapterToChapterInfo(chapter)
        );
        this.allChapters.set(chapterInfos);

        // Set the current chapter index immediately after loading chapters
        const currentIndex = chapterInfos.findIndex(
          (ch) => ch.id === Number(this.chapterId)
        );
        this.chapterIndexed.set(currentIndex);
      })
    );
  }

  private loadChapterDetail() {
    this.loading.set(true);
    this.error.set(null);

    this.chapterService.getChapterDetail(this.chapterId).subscribe({
      next: (response) => {
        const chapter = response.data;
        const chapterDetail = this.convertAPIChapterToChapterDetail(chapter);
        this.chapter.set(chapterDetail);
        this.comicName.set(chapter.comic?.title || 'Unknown Comic');
        this.loading.set(false);

        // Ensure chapter index is set correctly (in case chapters were loaded after)
        const currentIndex = this.allChapters().findIndex(
          (ch) => ch.id === Number(this.chapterId)
        );
        if (currentIndex !== -1) {
          this.chapterIndexed.set(currentIndex);
        }
      },
      error: (error) => {
        console.error('Error loading chapter:', error);
        this.error.set('Failed to load chapter. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private convertAPIChapterToChapterDetail(
    apiChapter: ChapterPlainObject
  ): ChapterDetailInfo {
    return {
      id: Number(apiChapter.id),
      comicId: this.comicId,
      title: apiChapter.title,
      chapterNumber: apiChapter.chapterNumber,
      position: apiChapter.position,
      isCrawled: apiChapter.crawlStatus === CrawlStatus.DONE,
      imageCount: apiChapter.images?.length || 0,
      sourceUrl: apiChapter.sourceUrl || '',
      createdAt: new Date(apiChapter.createdAt),
      updatedAt: new Date(apiChapter.updatedAt),
      images:
        apiChapter.images
          ?.map((image: ImagePlainObject) => ({
            id: Number(image.id),
            fileName: image.fileName,
            position: image.position,
            url: `http://localhost:19202/static/imgs/${image.fileName}`,
          }))
          .sort((a, b) => a.position - b.position) || [],
    };
  }

  private convertAPIMinimizedChapterToChapterInfo(
    apiChapter: MinimizeChapterResponseDto
  ): ChapterInfo {
    return {
      id: Number(apiChapter.id),
      comicId: this.comicId,
      title: apiChapter.title,
      chapterNumber: apiChapter.chapterNumber,
      position: apiChapter.position,
      isCrawled: apiChapter.crawlStatus === CrawlStatus.DONE,
      imageCount: 0,
      sourceUrl: apiChapter.sourceUrl || '',
      createdAt: new Date(apiChapter.createdAt),
      updatedAt: new Date(apiChapter.updatedAt),
    };
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.opacity = '1';

    // Hide loading overlay
    const container = img.closest('.relative');
    const loadingOverlay = container?.querySelector(
      '.loading-overlay'
    ) as HTMLElement;
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/placeholder-image.jpg';

    // Hide loading overlay even on error
    const container = img.closest('.relative');
    const loadingOverlay = container?.querySelector(
      '.loading-overlay'
    ) as HTMLElement;
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

  goToNextChapter() {
    const chapters = this.allChapters();
    const currentIndex = this.chapterIndexed();

    window.scrollTo({ top: 0, behavior: 'instant' });

    if (currentIndex < chapters.length - 1) {
      const nextChapter = chapters[currentIndex + 1];
      this.router.navigate(['/chapter', this.comicId, nextChapter.id]);
    }
  }

  goToPreviousChapter() {
    const chapters = this.allChapters();
    const currentIndex = this.chapterIndexed();

    window.scrollTo({ top: 0, behavior: 'instant' });

    if (currentIndex > 0) {
      const prevChapter = chapters[currentIndex - 1];
      this.router.navigate(['/chapter', this.comicId, prevChapter.id]);
    }
  }

  // Click area navigation for chapters
  onLeftAreaClick() {
    this.goToPreviousChapter();
  }

  onRightAreaClick() {
    this.goToNextChapter();
  }

  hasNextChapter(): boolean {
    return this.chapterIndexed() < this.allChapters().length - 1;
  }

  hasPreviousChapter(): boolean {
    return this.chapterIndexed() > 0;
  }

  onChapterSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const chapterIndex = parseInt(target.value, 10);
    const chapters = this.allChapters();

    if (chapterIndex >= 0 && chapterIndex < chapters.length) {
      const selectedChapter = chapters[chapterIndex];
      this.router.navigate(['/chapter', this.comicId, selectedChapter.id]);
    }
  }

  goBackToComic() {
    this.router.navigate(['/comic', this.comicId]);
  }
}
