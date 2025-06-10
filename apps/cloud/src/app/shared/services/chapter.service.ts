import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ChapterPlainObject,
  ChapterNavigationResponseDto,
  MinimizeChapterResponseDto
} from '../models/api/chapter.model';
import { ResponseMapper } from '../models/api/response-mapper.model';

@Injectable({
  providedIn: 'root',
})
export class ChapterService {
  private readonly apiUrl = 'http://localhost:19202/api/v1/chapter';

  constructor(private http: HttpClient) {}

  /**
   * Get chapter details by ID
   */
  getChapterDetail(chapterId: string): Observable<ResponseMapper<ChapterPlainObject>> {
    return this.http.get<ResponseMapper<ChapterPlainObject>>(`${this.apiUrl}/${chapterId}`);
  }

  /**
   * Get chapter navigation for a comic
   */
  getChapterNavigation(comicId: string): Observable<ResponseMapper<ChapterNavigationResponseDto[]>> {
    return this.http.get<ResponseMapper<ChapterNavigationResponseDto[]>>(`${this.apiUrl}/navigation/${comicId}`);
  }

  /**
   * Get minimized chapters by comic ID
   */
  getMinimizedChaptersByComic(comicId: string): Observable<ResponseMapper<MinimizeChapterResponseDto[]>> {
    return this.http.get<ResponseMapper<MinimizeChapterResponseDto[]>>(`${this.apiUrl}/by-comic/${comicId}`);
  }
}
