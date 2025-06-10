import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComicPlainObject, ComicSuggestionResponseDto, ComicSearchParams } from '../models/api/comic.model';
import { ResponseMapper } from '../models/api/response-mapper.model';

@Injectable({
  providedIn: 'root',
})
export class ComicService {
  private readonly apiUrl = 'http://localhost:19202/api/v1/comic';

  constructor(private http: HttpClient) {}

  /**
   * Search comics with optional parameters
   */
  searchComics(searchParams?: ComicSearchParams): Observable<ResponseMapper<ComicPlainObject[]>> {
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

    return this.http.get<ResponseMapper<ComicPlainObject[]>>(this.apiUrl, { params });
  }

  /**
   * Get comic suggestions by keyword
   */
  getComicSuggestions(keyword: string): Observable<ComicSuggestionResponseDto[]> {
    const params = new HttpParams().set('q', keyword);
    return this.http.get<ComicSuggestionResponseDto[]>(`${this.apiUrl}/suggest`, { params });
  }

  /**
   * Get comic details by ID
   */
  getComicDetail(comicId: string): Observable<ResponseMapper<ComicPlainObject>> {
    return this.http.get<ResponseMapper<ComicPlainObject>>(`${this.apiUrl}/${comicId}`);
  }
}
