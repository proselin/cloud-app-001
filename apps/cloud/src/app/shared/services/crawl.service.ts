import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CrawlByUrlRequestDto,
  CrawlComicByUrlResponseDto,
  CrawlChapterProgressEvent
} from '../models/api/crawl.model';
import { ResponseMapper } from '../models/api/response-mapper.model';

@Injectable({
  providedIn: 'root',
})
export class CrawlService {
  private readonly apiUrl = 'http://localhost:19202/api/v1/crawl';

  constructor(private http: HttpClient) {}

  /**
   * Crawl comic by URL
   */
  crawlComicByUrl(crawlRequest: CrawlByUrlRequestDto): Observable<ResponseMapper<CrawlComicByUrlResponseDto>> {
    return this.http.post<ResponseMapper<CrawlComicByUrlResponseDto>>(`${this.apiUrl}/by-url`, crawlRequest);
  }

  /**
   * Crawl chapter by comic ID using Server-Sent Events
   */
  crawlChapterByIdSSE(comicId: string): Observable<CrawlChapterProgressEvent> {
    return new Observable(observer => {
      const eventSource = new EventSource(`${this.apiUrl}/crawl-chapter-by-id-sse?comicId=${comicId}`);

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          observer.next(data);
        } catch (error) {
          observer.error(error);
        }
      };

      eventSource.onerror = error => {
        observer.error(error);
        eventSource.close();
      };

      // Return cleanup function
      return () => {
        eventSource.close();
      };
    });
  }
}
