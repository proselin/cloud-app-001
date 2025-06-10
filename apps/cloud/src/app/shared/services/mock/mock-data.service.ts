import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ComicInfo } from '../../models/types';
import { ResponseBuffer } from '../../../common/models/response.model';

export type SearchComicRes = ComicInfo[];

export interface ChapterInfo {
  id: string;
  comicId: string;
  title: string;
  chapterNumber: number;
  position: number;
  isCrawled: boolean;
  imageCount: number;
  sourceUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComicDetailInfo extends ComicInfo {
  id: string;
  chapters: ChapterInfo[];
  status: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChapterDetailInfo extends ChapterInfo {
  images: ChapterImage[];
}

export interface ChapterImage {
  id: string;
  fileName: string;
  position: number;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class MockDataService {
  private mockComics: ComicDetailInfo[] = [
    {
      id: '1',
      author: 'Stan Lee',
      url: 'https://example.com/spiderman',
      title: 'The Amazing Spider-Man',
      description: 'Follow the adventures of Peter Parker as he swings through New York City fighting crime.',
      imageUrl: 'https://example.com/spiderman-cover.jpg',
      chapterCount: 42,
      status: 'ongoing',
      tags: ['Action', 'Superhero', 'Marvel'],
      thumbImage: {
        fileName: 'spiderman-thumb.jpg'
      },
      chapters: this.generateMockChapters('1', 42),
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2024-12-01')
    },
    {
      id: '2',
      author: 'Bob Kane',
      url: 'https://example.com/batman',
      title: 'Batman: The Dark Knight',
      description: 'The caped crusader protects Gotham City from the forces of evil.',
      imageUrl: 'https://example.com/batman-cover.jpg',
      chapterCount: 38,
      status: 'ongoing',
      tags: ['Action', 'Superhero', 'DC'],
      thumbImage: {
        fileName: 'batman-thumb.jpg'
      },
      chapters: this.generateMockChapters('2', 38),
      createdAt: new Date('2023-02-01'),
      updatedAt: new Date('2024-11-15')
    },
    {
      id: '3',
      author: 'Jerry Siegel',
      url: 'https://example.com/superman',
      title: 'Superman: Man of Steel',
      description: 'The last son of Krypton protects Earth with his incredible powers.',
      imageUrl: 'https://example.com/superman-cover.jpg',
      chapterCount: 50,
      status: 'completed',
      tags: ['Action', 'Superhero', 'DC'],
      thumbImage: {
        fileName: 'superman-thumb.jpg'
      },
      chapters: this.generateMockChapters('3', 50),
      createdAt: new Date('2023-03-01'),
      updatedAt: new Date('2024-10-30')
    },
    {
      id: '4',
      author: 'Jack Kirby',
      url: 'https://example.com/fantastic-four',
      title: 'Fantastic Four',
      description: 'Four heroes with extraordinary powers work together to save the world.',
      imageUrl: 'https://example.com/fantastic-four-cover.jpg',
      chapterCount: 28,
      status: 'ongoing',
      tags: ['Action', 'Superhero', 'Marvel', 'Team'],
      thumbImage: {
        fileName: 'fantastic-four-thumb.jpg'
      },
      chapters: this.generateMockChapters('4', 28),
      createdAt: new Date('2023-04-01'),
      updatedAt: new Date('2024-12-05')
    },
    {
      id: '5',
      author: 'Chris Claremont',
      url: 'https://example.com/x-men',
      title: 'X-Men: Mutant Heroes',
      description: 'A team of mutants fights for peace between humans and mutants.',
      imageUrl: 'https://example.com/x-men-cover.jpg',
      chapterCount: 67,
      status: 'ongoing',
      tags: ['Action', 'Superhero', 'Marvel', 'Team', 'Mutants'],
      thumbImage: {
        fileName: 'x-men-thumb.jpg'
      },
      chapters: this.generateMockChapters('5', 67),
      createdAt: new Date('2023-05-01'),
      updatedAt: new Date('2024-12-08')
    }
  ];

  private mockImageBuffers: Record<string, ResponseBuffer> = {
    'spiderman-thumb.jpg': {
      type: 'Buffer',
      data: this.generateMockImageBuffer()
    },
    'batman-thumb.jpg': {
      type: 'Buffer',
      data: this.generateMockImageBuffer()
    },
    'superman-thumb.jpg': {
      type: 'Buffer',
      data: this.generateMockImageBuffer()
    },
    'fantastic-four-thumb.jpg': {
      type: 'Buffer',
      data: this.generateMockImageBuffer()
    },
    'x-men-thumb.jpg': {
      type: 'Buffer',
      data: this.generateMockImageBuffer()
    }
  };

  /**
   * Mock implementation of searchComic
   */
  searchComic(): Observable<{ response: SearchComicRes }> {
    return of({ response: this.mockComics }).pipe(delay(500));
  }

  /**
   * Mock implementation of getComicDetail
   */
  getComicDetail(id: string): Observable<{ response: ComicDetailInfo | null }> {
    const comic = this.mockComics.find(c => c.id === id);
    return of({ response: comic || null }).pipe(delay(600));
  }

  /**
   * Mock implementation of getChapterDetail
   */
  getChapterDetail(comicId: string, chapterId: string): Observable<{ response: ChapterDetailInfo | null }> {
    const comic = this.mockComics.find(c => c.id === comicId);
    if (!comic) {
      return of({ response: null }).pipe(delay(400));
    }

    const chapter = comic.chapters.find(ch => ch.id === chapterId);
    if (!chapter) {
      return of({ response: null }).pipe(delay(400));
    }

    const chapterDetail: ChapterDetailInfo = {
      ...chapter,
      images: this.generateMockChapterImages(chapterId, chapter.imageCount)
    };

    return of({ response: chapterDetail }).pipe(delay(800));
  }

  /**
   * Mock implementation of getChapterNavigation
   */
  getChapterNavigation(comicId: string): Observable<{ response: ChapterInfo[] | null }> {
    const comic = this.mockComics.find(c => c.id === comicId);
    return of({ response: comic?.chapters || null }).pipe(delay(400));
  }

  /**
   * Mock implementation of searchComicSuggestions
   */
  searchComicSuggestions(query: string): Observable<{ response: SearchComicRes }> {
    const filteredComics = this.mockComics.filter(comic =>
      comic.title.toLowerCase().includes(query.toLowerCase()) ||
      comic.author.toLowerCase().includes(query.toLowerCase()) ||
      comic.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    return of({ response: filteredComics }).pipe(delay(300));
  }

  /**
   * Mock implementation of pullComicByUrl
   */
  pullComicByUrl(url: string): Observable<{ response: SearchComicRes }> {
    // Simple mock: return comics that match the URL or a filtered subset
    const filteredComics = url
      ? this.mockComics.filter(comic =>
          comic.url.toLowerCase().includes(url.toLowerCase()) ||
          comic.title.toLowerCase().includes(url.toLowerCase()) ||
          comic.author.toLowerCase().includes(url.toLowerCase())
        )
      : this.mockComics.slice(0, 3); // Return first 3 comics as demo

    return of({ response: filteredComics }).pipe(delay(800));
  }

  /**
   * Mock implementation of getImageFile
   */
  getImageFile(fileName: string): Observable<{ response: ResponseBuffer }> {
    const buffer = this.mockImageBuffers[fileName] || {
      type: 'Buffer' as const,
      data: this.generateMockImageBuffer()
    };

    return of({ response: buffer }).pipe(delay(300));
  }

  /**
   * Generates mock chapters for a comic
   */
  private generateMockChapters(comicId: string, chapterCount: number): ChapterInfo[] {
    const chapters: ChapterInfo[] = [];

    for (let i = 1; i <= chapterCount; i++) {
      const isCrawled = Math.random() > 0.3; // 70% chance of being crawled
      chapters.push({
        id: `${comicId}-ch-${i}`,
        comicId,
        title: `Chapter ${i}`,
        chapterNumber: i,
        position: i,
        isCrawled,
        imageCount: isCrawled ? Math.floor(Math.random() * 20) + 10 : 0, // 10-30 images if crawled
        sourceUrl: `https://example.com/comic/${comicId}/chapter/${i}`,
        createdAt: new Date(2023, 0, i), // Spread across 2023
        updatedAt: new Date(2024, 0, i)
      });
    }

    return chapters.reverse(); // Latest chapters first
  }

  /**
   * Generates mock chapter images
   */
  private generateMockChapterImages(chapterId: string, imageCount: number): ChapterImage[] {
    const images: ChapterImage[] = [];

    for (let i = 1; i <= imageCount; i++) {
      images.push({
        id: `${chapterId}-img-${i}`,
        fileName: `chapter-${chapterId}-page-${i}.jpg`,
        position: i,
        url: `https://example.com/images/chapter-${chapterId}-page-${i}.jpg`
      });
    }

    return images;
  }

  /**
   * Generates a mock image buffer (simple placeholder)
   */
  private generateMockImageBuffer(): number[] {
    // Generate a simple mock buffer that represents a small image
    const mockBuffer: number[] = [];

    // Create a simple pattern that could represent image data
    for (let i = 0; i < 1000; i++) {
      mockBuffer.push(Math.floor(Math.random() * 256));
    }

    return mockBuffer;
  }

  /**
   * Helper method to add more mock comics (for future expansion)
   */
  addMockComic(comic: ComicDetailInfo): void {
    this.mockComics.push(comic);

    if (comic.thumbImage?.fileName) {
      this.mockImageBuffers[comic.thumbImage.fileName] = {
        type: 'Buffer',
        data: this.generateMockImageBuffer()
      };
    }
  }

  /**
   * Get all available mock comics
     /**
   * Get all available mock comics (for admin/debug purposes)
   */
  getAllMockComics(): ComicDetailInfo[] {
    return [...this.mockComics];
  }
}
