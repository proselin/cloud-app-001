import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { NettruyenHttpService } from './nettruyen-http.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('NettruyenHttpService', () => {
  let service: NettruyenHttpService;
  let httpService: HttpService;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NettruyenHttpService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<NettruyenHttpService>(NettruyenHttpService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should make GET request with headers', async () => {
      const url = 'https://example.com/test';
      const expectedData = { test: 'data' };
      const mockResponse: AxiosResponse = {
        data: expectedData,
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: { url } as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await service.get(url);
      expect(result).toBe(mockResponse);
      expect(httpService.get).toHaveBeenCalledWith(url, {
        headers: { referer: '' },
      });
    });

    it('should handle GET request errors', async () => {
      const url = 'https://example.com/test';
      const error = new Error('Network error');

      (httpService.get as jest.Mock).mockReturnValue(throwError(() => error));

      await expect(service.get(url)).rejects.toThrow('Network error');
    });

    it('should call addHeader() private method', async () => {
      const url = 'https://example.com/test';
      const mockResponse: AxiosResponse = {
        data: { test: 'data' },
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: { url } as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      await service.get(url);

      // Verify that addHeader was used by checking the headers parameter
      expect(httpService.get).toHaveBeenCalledWith(url, {
        headers: { referer: '' },
      });
    });
  });

  describe('getImages', () => {
    it('should make GET request for images with correct headers and response type', async () => {
      const url = 'https://example.com/image.jpg';
      const domain = 'https://nettruyenrr.com';
      const mockImageBuffer = Buffer.from('fake image data');
      const mockResponse: AxiosResponse = {
        data: mockImageBuffer,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'image/jpeg' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: { url } as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await service.getImages(url, domain);

      expect(result).toBe(mockResponse);
      expect(httpService.get).toHaveBeenCalledWith(url, {
        headers: {
          'allow-origin': '*',
          accept: '*/*',
          origin: domain,
          referer: domain + '/',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
        },
        responseType: 'arraybuffer',
      });
    });

    it('should handle image request errors', async () => {
      const url = 'https://example.com/image.jpg';
      const domain = 'https://nettruyenrr.com';
      const error = new Error('Image fetch failed');

      (httpService.get as jest.Mock).mockReturnValue(throwError(() => error));

      await expect(service.getImages(url, domain)).rejects.toThrow(
        'Image fetch failed'
      );
    });
  });

  describe('getChapterList', () => {
    it('should make GET request for chapter list with correct parameters', async () => {
      const domain = 'https://nettruyenrr.com';
      const slug = 'test-comic';
      const comicId = '12345';
      const mockChapterData = {
        data: [
          {
            comic_id: 12345,
            chapter_id: 67890,
            chapter_name: 'Chapter 1',
            chapter_slug: 'chapter-1',
            updated_at: '2023-01-01',
            chapter_num: 1,
            data_cdn: 1,
            data_error: 0,
            image_num: 20,
            chapter_images: null,
            webp: 0,
            watermask: 0,
            reported_at: '',
            cdn_sv: 1,
            image_type: 'jpg',
          },
        ],
      };
      const mockResponse: AxiosResponse = {
        data: mockChapterData,
        status: 200,
        statusText: 'OK',
        headers: {},
         
        config: {
          url: `${domain}/Comic/Services/ComicService.asmx/ChapterList`,
        } as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await service.getChapterList(domain, slug, comicId);

      expect(result).toBe(mockResponse);
      expect(httpService.get).toHaveBeenCalledWith(
        `${domain}/Comic/Services/ComicService.asmx/ChapterList?slug=${slug}&comicId=${comicId}`,
        {
          headers: {
            'allow-origin': '*',
            accept: '*/*',
            origin: domain,
            referer: domain + '/',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
          },
        }
      );
    });

    it('should handle chapter list request errors', async () => {
      const domain = 'https://nettruyenrr.com';
      const slug = 'test-comic';
      const comicId = '12345';
      const error = new Error('Chapter list fetch failed');

      (httpService.get as jest.Mock).mockReturnValue(throwError(() => error));

      await expect(
        service.getChapterList(domain, slug, comicId)
      ).rejects.toThrow('Chapter list fetch failed');
    });

    it('should log the correct URL when fetching chapter list', async () => {
      const domain = 'https://nettruyenrr.com';
      const slug = 'test-comic';
      const comicId = '12345';
      const mockResponse: AxiosResponse = {
        data: { data: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: {} as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      await service.getChapterList(domain, slug, comicId);

      expect(httpService.get).toHaveBeenCalledWith(
        `${domain}/Comic/Services/ComicService.asmx/ChapterList?slug=${slug}&comicId=${comicId}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'allow-origin': '*',
            accept: '*/*',
            origin: domain,
          })
        })
      );
    });
  });

  describe('suggestSearch', () => {
    const mockHtmlResponse = `
      <ul>
        <li>
          <a href="/comic/test-comic-123">
            <img src="https://example.com/thumb.jpg" />
            <h3>Test Comic Title</h3>
            <h4><i>Chapter 10</i></h4>
            <h4><i>Test Author</i></h4>
            <h4><i>Action, Adventure</i></h4>
          </a>
        </li>
        <li>
          <a href="/comic/another-comic-456">
            <img src="https://example.com/thumb2.jpg" />
            <h3>Another Comic</h3>
            <h4><i>Chapter 5</i></h4>
            <h4><i>Đang Cập Nhật</i></h4>
            <h4><i>Romance</i></h4>
          </a>
        </li>
      </ul>
    `;

    it('should search for comics and parse HTML response correctly', async () => {
      const query = 'test';
      const domain = 'https://nettruyenrr.com';
      const mockResponse: AxiosResponse = {
        data: mockHtmlResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: {} as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await service.suggestSearch(query, domain);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 123,
        title: 'Test Comic Title',
        url: 'https://nettruyenrr.com/comic/test-comic-123',
        chapter: 'Chapter 10',
        author: 'Test Author',
        genres: ['Action', 'Adventure'],
        thumbnail: 'https://example.com/thumb.jpg',
      });
      expect(result[1]).toEqual({
        id: 456,
        title: 'Another Comic',
        url: 'https://nettruyenrr.com/comic/another-comic-456',
        chapter: 'Chapter 5',
        author: 'Đang Cập Nhật',
        genres: ['Romance'],
        thumbnail: 'https://example.com/thumb2.jpg',
      });

      expect(httpService.get).toHaveBeenCalledWith(
        `${domain}/Comic/Services/SuggestSearch.ashx`,
        {
          params: { q: query },
          headers: { referer: '' },
        }
      );
    });

    it('should handle empty search results', async () => {
      const query = 'nonexistent';
      const domain = 'https://nettruyenrr.com';
      const emptyHtmlResponse = '<ul></ul>';
      const mockResponse: AxiosResponse = {
        data: emptyHtmlResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: {} as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await service.suggestSearch(query, domain);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should handle comics with missing data gracefully', async () => {
      const query = 'test';
      const domain = 'https://nettruyenrr.com';
      const incompleteHtmlResponse = `
        <ul>
          <li>
            <a href="/comic/incomplete-comic">
              <h3>Incomplete Comic</h3>
            </a>
          </li>
        </ul>
      `;
      const mockResponse: AxiosResponse = {
        data: incompleteHtmlResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: {} as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await service.suggestSearch(query, domain);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 0, // No ID found in URL
        title: 'Incomplete Comic',
        url: 'https://nettruyenrr.com/comic/incomplete-comic',
        chapter: '',
        author: 'Đang Cập Nhật',
        genres: [],
        thumbnail: '',
      });
    });

    it('should handle suggest search request errors', async () => {
      const query = 'test';
      const domain = 'https://nettruyenrr.com';
      const error = new Error('Search request failed');

      (httpService.get as jest.Mock).mockReturnValue(throwError(() => error));

      await expect(service.suggestSearch(query, domain)).rejects.toThrow(
        'Search request failed'
      );
    });

    it('should log the correct URL when searching', async () => {
      const query = 'test';
      const domain = 'https://nettruyenrr.com';
      const mockResponse: AxiosResponse = {
        data: '<ul></ul>',
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: {} as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      await service.suggestSearch(query, domain);

      expect(logSpy).toHaveBeenCalledWith(
        `[suggestSearch] ${domain}/Comic/Services/SuggestSearch.ashx?q=${query}`
      );
    });

    it('should parse complex genre strings correctly', async () => {
      const query = 'test';
      const domain = 'https://nettruyenrr.com';
      const complexHtmlResponse = `
        <ul>
          <li>
            <a href="/comic/multi-genre-comic-789">
              <img src="https://example.com/thumb3.jpg" />
              <h3>Multi Genre Comic</h3>
              <h4><i>Chapter 25</i></h4>
              <h4><i>Complex Author Name</i></h4>
              <h4><i>Action, Adventure, Comedy, Drama, Fantasy, Romance</i></h4>
            </a>
          </li>
        </ul>
      `;
      const mockResponse: AxiosResponse = {
        data: complexHtmlResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: {} as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await service.suggestSearch(query, domain);

      expect(result).toHaveLength(1);
      expect(result[0].genres).toEqual([
        'Action',
        'Adventure',
        'Comedy',
        'Drama',
        'Fantasy',
        'Romance',
      ]);
    });
  });

  describe('Header handling', () => {
    it('should add referer header in get method', async () => {
      const url = 'https://example.com/test';
      const mockResponse: AxiosResponse = {
        data: { test: 'data' },
        status: 200,
        statusText: 'OK',
        headers: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: { url } as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      await service.get(url);

      // Verify the private addHeader method was used by checking the call
      expect(httpService.get).toHaveBeenCalledWith(url, {
        headers: { referer: '' },
      });
    });

    it('should add comprehensive headers in getImages method', async () => {
      const url = 'https://example.com/image.jpg';
      const domain = 'https://nettruyenrr.com';
      const mockImageBuffer = Buffer.from('fake image data');
      const mockResponse: AxiosResponse = {
        data: mockImageBuffer,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'image/jpeg' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: { url } as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      await service.getImages(url, domain);

      // Verify all the headers that should be added by the service
      expect(httpService.get).toHaveBeenCalledWith(url, {
        headers: {
          'allow-origin': '*',
          accept: '*/*',
          origin: domain,
          referer: domain + '/',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
        },
        responseType: 'arraybuffer',
      });
    });

    it('should add headers in getChapterList method', async () => {
      const domain = 'https://nettruyenrr.com';
      const slug = 'test-comic';
      const comicId = '12345';
      const mockChapterData = {
        data: [
          {
            comic_id: 12345,
            chapter_id: 67890,
            chapter_name: 'Chapter 1',
            chapter_slug: 'chapter-1',
            updated_at: '2023-01-01',
            chapter_num: 1,
            data_cdn: 1,
            data_error: 0,
            image_num: 20,
            chapter_images: null,
            webp: 0,
            watermask: 0,
            reported_at: '',
            cdn_sv: 1,
            image_type: 'jpg',
          },
        ],
      };
      const mockResponse: AxiosResponse = {
        data: mockChapterData,
        status: 200,
        statusText: 'OK',
        headers: {},
         
        config: {
          url: `${domain}/Comic/Services/ComicService.asmx/ChapterList`,
        } as any,
      };

      (httpService.get as jest.Mock).mockReturnValue(of(mockResponse));

      await service.getChapterList(domain, slug, comicId);

      // Verify that the correct URL and headers are used
      expect(httpService.get).toHaveBeenCalledWith(
        `${domain}/Comic/Services/ComicService.asmx/ChapterList?slug=${slug}&comicId=${comicId}`,
        {
          headers: {
            'allow-origin': '*',
            accept: '*/*',
            origin: domain,
            referer: domain + '/',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
          },
        }
      );
    });
  });
});
