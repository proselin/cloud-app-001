import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private readonly apiUrl = 'http://localhost:19202';

  constructor(private http: HttpClient) {}

  /**
   * Get image file by filename
   */
  getImageFile(fileName: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/img/${fileName}`, {
      responseType: 'blob'
    });
  }

  /**
   * Get comic thumbnail by comic ID and filename
   */
  getComicThumbnail(comicId: string, fileName: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/img/comic/${comicId}/${fileName}`, {
      responseType: 'blob'
    });
  }

  /**
   * Get chapter image by chapter ID and image index
   */
  getChapterImage(chapterId: string, imageIndex: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/img/chapter/${chapterId}/${imageIndex}`, {
      responseType: 'blob'
    });
  }

  /**
   * Create an object URL from blob data for displaying images
   */
  createImageUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Clean up object URL
   */
  revokeImageUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
