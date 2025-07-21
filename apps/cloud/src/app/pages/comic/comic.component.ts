import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BasePagesComponent } from '../../common/components';
import { ComicService } from '../../shared/services';
import { ChapterShortInfo, ComicDetailInfo, ComicPlainObject } from '../../shared/models/api';
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

  comic = signal<ComicDetailInfo | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  isLoadingFromAPI = signal<boolean>(false);

  // Sync/Crawl functionality
  isSyncing = signal(false);
  syncProgress = signal<string>('');
  syncStatus = signal<'idle' | 'connecting' | 'syncing' | 'completed' | 'error'>('idle');
  private eventSource: EventSource | null = null;

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
        const data = JSON.parse(event.data);
        this.syncProgress.set(data.message || 'Processing...');
        console.log(data)
        // Update progress based on data
        if (data.status === 'completed') {
          this.syncStatus.set('completed');
          this.syncProgress.set('Sync completed successfully!');
          this.closeSyncConnection();

          // Refresh comic data after sync
          setTimeout(() => {
            this.loadComicDetail(comic.id.toString());
            this.resetSyncState();
          }, 2000);
        } else if (data.status === 'error') {
          this.syncStatus.set('error');
          this.syncProgress.set(data.message || 'Sync failed');
          this.closeSyncConnection();

          setTimeout(() => {
            this.resetSyncState();
          }, 3000);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
        this.syncProgress.set(event.data);
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
}
