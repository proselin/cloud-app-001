import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CrawlByUrlRequestDto,
  CrawlChapterProgressEvent,
  CrawlComicByUrlResponseDto,
  CrawlChapterRequestDto,
  CrawlChapterResponseDto,
} from '../models/api';
import { ResponseMapper } from '../models/api';
import { ApiCommonService } from '../../common/services/api-common.service';

@Injectable({
  providedIn: 'root',
})
export class CrawlService extends ApiCommonService {
  /**
   * Crawl comic by URL
   */
  crawlComicByUrl(
    crawlRequest: CrawlByUrlRequestDto
  ): Observable<ResponseMapper<CrawlComicByUrlResponseDto>> {
    return this.httpClient.post<ResponseMapper<CrawlComicByUrlResponseDto>>(
      `${this.env.apiUrl}/crawl/by-url`,
      crawlRequest
    );
  }

  /**
   * Crawl chapter by comic ID using Server-Sent Events
   */
  crawlChapterByIdSSE(comicId: string): Observable<CrawlChapterProgressEvent> {
    return new Observable((observer) => {
      const eventSource = new EventSource(
        `${this.env.apiUrl}/crawl/crawl-chapter-by-id-sse?comicId=${comicId}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          observer.next(data);
        } catch (error) {
          observer.error(error);
        }
      };

      eventSource.onerror = (error) => {
        observer.error(error);
        eventSource.close();
      };

      // Return cleanup function
      return () => {
        eventSource.close();
      };
    });
  }

  /**
   * Crawl a single chapter by chapter ID
   */
  crawlSingleChapter(
    crawlRequest: CrawlChapterRequestDto
  ): Observable<ResponseMapper<CrawlChapterResponseDto>> {
    return this.httpClient.post<ResponseMapper<CrawlChapterResponseDto>>(
      `${this.env.apiUrl}/crawl/chapter`,
      crawlRequest
    );
  }
}
