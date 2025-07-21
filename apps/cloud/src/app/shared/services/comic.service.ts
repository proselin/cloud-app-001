import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ComicPlainObject,
  ComicSearchParams,
  ResponseMapper,
  SuggestComic,
} from '../models/api';
import { ApiCommonService } from '../../common/services/api-common.service';

@Injectable({
  providedIn: 'root',
})
export class ComicService extends ApiCommonService {

  /**
   * Search comics with optional parameters
   */
  searchComics(searchParams?: ComicSearchParams): Observable<ResponseMapper<{data:  ComicPlainObject[]}>> {
    let params = new HttpParams();
    if (searchParams?.page) {
      params = params.set('page', searchParams.page.toString());
    }
    if (searchParams?.limit) {
      params = params.set('limit', searchParams.limit.toString());
    }
    if (searchParams?.search) {
      params = params.set('search', searchParams.search);
    }
    if (searchParams?.genre) {
      params = params.set('genre', searchParams.genre);
    }

    return this.httpClient.get<ResponseMapper<{data:  ComicPlainObject[]}>>(`${this.env.apiUrl}/comic`, { params });
  }

  /**
   * Get comic suggestions by keyword
   */
  getComicSuggestions(keyword: string): Observable<SuggestComic[]> {
    const params = new HttpParams().set('q', keyword);
    return this.httpClient.get<SuggestComic[]>(`${this.env.apiUrl}/comic/suggest`, { params });
  }

  /**
   * Get comic details by ID
   */
  getComicDetail(comicId: string): Observable<ResponseMapper<ComicPlainObject>> {
    return this.httpClient.get<ResponseMapper<ComicPlainObject>>(`${this.env.apiUrl}/comic/${comicId}`);
  }
}
