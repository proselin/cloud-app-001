import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePagesComponent } from '../../common/components';
import { ComicService } from '../../shared/services';
import { CrawlService } from '../../shared/services/crawl.service';
import { ChapterShortInfo, ComicDetailInfo, ComicPlainObject, CrawlChapterRequestDto } from '../../shared/models/api';
import { CrawlStatus } from '../../common/variables/crawlStatus';
import { generateImageLink } from '../../common/utils/functions';


@Component({
  selector: 'cloud-comic',
  imports: [CommonModule],
  templateUrl: './comic.component.html',
  styleUrl: './comic.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComicComponent
  extends BasePagesComponent
  implements OnInit, OnDestroy
{
  private comicService = inject(ComicService);
  private crawlService = inject(CrawlService);

  comic = signal<ComicDetailInfo | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  isLoadingFromAPI = signal<boolean>(false);

  // Sync/Crawl functionality
  isSyncing = signal(false);
  syncProgress = signal<string>('');
  syncStatus = signal<'idle' | 'connecting' | 'syncing' | 'completed' | 'error'>('idle');
  private eventSource: EventSource | null = null;
  private completionTimeout: ReturnType<typeof setTimeout> | null = null;

  // Chapter individual crawling state
  crawlingChapters = signal<Set<number>>(new Set());
  crawlErrors = signal<Map<number, string>>(new Map());

  // Chapter view mode control
  chapterViewMode = signal<'detailed' | 'compact'>('detailed');

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const comicId = params['id'];
      if (comicId) {
        this.loadComicDetail(comicId);
      }
    });
  }

  private loadComicDetail(comicId: string) {
    this.loading.set(true);
    this.error.set(null);
    this.isLoadingFromAPI.set(true);

    // Try to fetch from real API first
    this.comicService.getComicDetail(comicId).subscribe({
      next: (result) => {
        this.isLoadingFromAPI.set(false);
        // Convert API response to ComicDetailInfo format
        const convertedComic = this.convertAPIComicToComicDetail(result.data);
        this.comic.set(convertedComic);
        console.log(
          '✅ Successfully loaded comic detail from API:',
          result.data.title
        );

        this.loading.set(false);
      },
      error: (error) => {
        this.isLoadingFromAPI.set(false);
        console.warn(
          '⚠️ Comic detail API request failed, falling back to mock data:',
          error
        );
      },
    });
  }

  private convertAPIComicToComicDetail(
    apiComic: ComicPlainObject
  ): ComicDetailInfo {
    const result: ComicDetailInfo = {
      id: Number(apiComic.id), // Convert number to string for frontend
      title: apiComic.title,
      author: 'Unknown author', // Backend doesn't have author field in main comic object
      description: apiComic.description ?? 'No description available',
      url: apiComic.originId ?? '', // Use originId as URL fallback
      imageUrl: generateImageLink(this.env.staticImgsUrl, apiComic.thumbImage?.fileName),
      status: apiComic.status ?? 'ongoing', // Default to 'ongoing' if status is missing
      chapterCount: apiComic.chapterCount,
      tags: [], // Backend doesn't have tags in main response
      chapters: [],
      createdAt: new Date(apiComic.createdAt),
      updatedAt: new Date(apiComic.updatedAt),
    };

    // Add optional thumbImage
    if (apiComic.thumbImage) {
      result.thumbImage = {
        fileName: apiComic.thumbImage.fileName,
      };
    }

    // Convert chapters
    if (apiComic.chapters) {
      result.chapters = apiComic.chapters.map(
        (chapter) =>
          ({
            id: chapter.id,
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            position: chapter.position,
            isCrawled: chapter.crawlStatus === CrawlStatus.DONE, // Check if crawl is complete
            sourceUrl: chapter.sourceUrl,
            createdAt: chapter.createdAt,
            updatedAt: chapter.updatedAt,
            crawlStatus: chapter.crawlStatus,
          } satisfies ChapterShortInfo)
      ).sort((a, b) => a.position - b.position);
    }

    return result;
  }

  navigateToChapter(chapter: ChapterShortInfo) {
    const comic = this.comic();
    if (comic && chapter.isCrawled) {
      this.router.navigate(['/chapter', comic.id, chapter.id]);
    }
  }

  getStatusColor(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'completed';
      case 'ongoing':
        return 'ongoing';
      case 'hiatus':
        return 'hiatus';
      default:
        return 'ongoing';
    }
  }

  getCrawlStatusText(chapter: ChapterShortInfo): string {
    return chapter.isCrawled ? `Crawled` : 'Not crawled';
  }

  getCrawledChaptersCount(): number {
    const comic = this.comic();
    return comic ? comic.chapters.filter((ch) => ch.isCrawled).length : 0;
  }

  setChapterViewMode(mode: 'detailed' | 'compact') {
    this.chapterViewMode.set(mode);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  // Sync/Crawl functionality
  syncComic() {
    const comic = this.comic();
    if (!comic || this.isSyncing()) return;

    this.isSyncing.set(true);
    this.syncStatus.set('connecting');
    this.syncProgress.set('Connecting to server...');

    // Close existing connection if any
    if (this.eventSource) {
      this.eventSource.close();
    }

    const sseUrl = `${this.env.apiUrl}/crawl/crawl-chapter-by-id-sse?comicId=${comic.id}`;
    this.eventSource = new EventSource(sseUrl);

    this.eventSource.onopen = () => {
      this.syncStatus.set('syncing');
      this.syncProgress.set('Starting sync process...');
    };

    this.eventSource.onmessage = (event) => {
      console.log('SSE message received:', event.data);
      try {
        const response = JSON.parse(event.data);

        // Handle regular chapter data
        if (response.data) {
          const chapterTitle = response.data.title || `Chapter ${response.data.chapterNumber}`;
          this.syncProgress.set(`Processing ${chapterTitle}...`);
          console.log('Chapter processed:', response.data);

          // Reset completion timeout since we're still receiving data
          if (this.completionTimeout) {
            clearTimeout(this.completionTimeout);
          }

          // Set a new timeout to detect completion
          this.completionTimeout = setTimeout(() => {
            this.syncStatus.set('completed');
            this.syncProgress.set('Sync completed successfully!');
            this.closeSyncConnection();

            // Refresh comic data after sync
            setTimeout(() => {
              this.loadComicDetail(comic.id.toString());
              this.resetSyncState();
            }, 2000);
          }, 3000); // Wait 3 seconds after last message
        } else {
          this.syncProgress.set(response.message || 'Processing...');
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
        this.syncProgress.set('Processing...');
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.syncStatus.set('error');
      this.syncProgress.set('Connection error. Please try again.');
      this.closeSyncConnection();

      setTimeout(() => {
        this.resetSyncState();
      }, 3000);
    };
  }

  private closeSyncConnection() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.completionTimeout) {
      clearTimeout(this.completionTimeout);
      this.completionTimeout = null;
    }
  }

  private resetSyncState() {
    this.isSyncing.set(false);
    this.syncStatus.set('idle');
    this.syncProgress.set('');
  }

  cancelSync() {
    this.closeSyncConnection();
    this.resetSyncState();
  }

  // Cleanup on component destroy
  ngOnDestroy() {
    this.closeSyncConnection();
  }

  /**
   * Crawl a specific chapter
   */
  crawlChapter(chapter: ChapterShortInfo, event?: Event) {
    if (event) {
      event.stopPropagation(); // Prevent navigation when clicking crawl button
    }

    if (this.crawlingChapters().has(chapter.id)) return;

    const crawlingSet = new Set(this.crawlingChapters());
    crawlingSet.add(chapter.id);
    this.crawlingChapters.set(crawlingSet);

    // Clear any previous errors for this chapter
    const errorMap = new Map(this.crawlErrors());
    errorMap.delete(chapter.id);
    this.crawlErrors.set(errorMap);

    const crawlRequest: CrawlChapterRequestDto = {
      chapterId: chapter.id
    };

    this.crawlService.crawlSingleChapter(crawlRequest).subscribe({
      next: (response) => {
        if (response.data && response.data.crawlStatus === CrawlStatus.DONE) {
          // Remove from crawling set
          const crawlingSet = new Set(this.crawlingChapters());
          crawlingSet.delete(chapter.id);
          this.crawlingChapters.set(crawlingSet);

          // Update chapter status in the comic
          const comic = this.comic();
          if (comic) {
            const updatedChapters = comic.chapters.map(ch =>
              ch.id === chapter.id
                ? { ...ch, isCrawled: true, updatedAt: new Date().toISOString() }
                : ch
            );
            this.comic.set({ ...comic, chapters: updatedChapters });
          }
        } else {
          // Handle crawl failure
          const crawlingSet = new Set(this.crawlingChapters());
          crawlingSet.delete(chapter.id);
          this.crawlingChapters.set(crawlingSet);

          const errorMap = new Map(this.crawlErrors());
          errorMap.set(chapter.id, 'Failed to crawl chapter');
          this.crawlErrors.set(errorMap);
        }
      },
      error: (error) => {
        console.error('Error crawling chapter:', error);

        // Remove from crawling set
        const crawlingSet = new Set(this.crawlingChapters());
        crawlingSet.delete(chapter.id);
        this.crawlingChapters.set(crawlingSet);

        // Set error message
        const errorMap = new Map(this.crawlErrors());
        errorMap.set(chapter.id, 'Failed to crawl chapter. Please try again.');
        this.crawlErrors.set(errorMap);
      }
    });
  }

  /**
   * Check if a chapter is currently being crawled
   */
  isChapterCrawling(chapterId: number): boolean {
    return this.crawlingChapters().has(chapterId);
  }

  /**
   * Get crawl error for a chapter
   */
  getChapterCrawlError(chapterId: number): string | null {
    return this.crawlErrors().get(chapterId) || null;
  }

  /**
   * Clear crawl error for a chapter
   */
  clearChapterCrawlError(chapterId: number) {
    const errorMap = new Map(this.crawlErrors());
    errorMap.delete(chapterId);
    this.crawlErrors.set(errorMap);
  }
}
