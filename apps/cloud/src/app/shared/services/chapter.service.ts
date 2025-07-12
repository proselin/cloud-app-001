import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ChapterPlainObject,
  ChapterNavigationResponseDto,
  MinimizeChapterResponseDto
} from '../models/api';
import { ResponseMapper } from '../models/api';
import { ApiCommonService } from '../../common/services/api-common.service';

@Injectable({
  providedIn: 'root',
})
export class ChapterService  extends ApiCommonService{
  private readonly apiUrl = this.env.apiUrl

  /**
   * Get chapter details by ID
   */
  getChapterDetail(chapterId: number): Observable<ResponseMapper<ChapterPlainObject>> {
    return this.httpClient.get<ResponseMapper<ChapterPlainObject>>(`${this.env.apiUrl}/chapter/${chapterId}`);
  }

  /**
   * Get chapter navigation for a comic
   */
  getChapterNavigation(comicId: number): Observable<ResponseMapper<ChapterNavigationResponseDto[]>> {
    return this.httpClient.get<ResponseMapper<ChapterNavigationResponseDto[]>>(`${this.env.apiUrl}/chapter/navigation/${comicId}`);
  }

  /**
   * Get minimized chapters by comic ID
   */
  getMinimizedChaptersByComic(comicId: number): Observable<ResponseMapper<MinimizeChapterResponseDto[]>> {
    return this.httpClient.get<ResponseMapper<MinimizeChapterResponseDto[]>>(`${this.env.apiUrl}/chapter/by-comic/${comicId}`);
  }
}
