import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { SuggestComicDto } from '../models/internals/suggest-comic.dto';
import * as cheerio from 'cheerio';
import { tap } from 'rxjs/operators';

interface INettruyenChapterListResponseItem {
  comic_id: number;
  chapter_id: number;
  chapter_name: string;
  chapter_slug: string;
  updated_at: string;
  chapter_num: number;
  data_cdn: number;
  data_error: number;
  image_num: number;
  chapter_images: unknown;
  webp: number;
  watermask: number;
  reported_at: string;
  cdn_sv: number;
  image_type: string;
}

type NettruyenGetChapterListResponse = {
  data: INettruyenChapterListResponseItem[];
};

@Injectable()
export class NettruyenHttpService {
  private logger = new Logger(NettruyenHttpService.name);

  constructor(private httpService: HttpService) {}

  private addHeader() {
    return {
      referer: '',
    };
  }

  get(url: string) {
    return firstValueFrom(
      this.httpService.get(url, { headers: this.addHeader() })
    );
  }

  getImages(url: string, domain: string) {
    return firstValueFrom(
      this.httpService.get(url, {
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
      })
    );
  }

  getChapterList(domain: string, slug: string, comicId: string) {
    return firstValueFrom(
      this.httpService.get<NettruyenGetChapterListResponse>(
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
      )
    );
  }

  async suggestSearch(
    query: string,
    domain: string
  ): Promise<SuggestComicDto[]> {
    this.logger.log(
      `[suggestSearch] ${domain}/Comic/Services/SuggestSearch.ashx?q=${query}`
    );

    const response = await firstValueFrom(
      this.httpService.get(`${domain}/Comic/Services/SuggestSearch.ashx`, {
        params: { q: query },
        headers: this.addHeader(),
      })
    );

    // Parse HTML response with cheerio
    const $ = cheerio.load(response.data);
    const comics: SuggestComicDto[] = [];

    $('ul li a').each((_, element) => {
      const href = $(element).attr('href') || '';
      const idMatch = href.match(/(\d+)$/); // Extract ID from URL
      const id = idMatch ? parseInt(idMatch[1], 10) : 0;
      const thumbnail = $(element).find('img').attr('src') || '';
      const title = $(element).find('h3').text().trim();
      const h4Elements = $(element)
        .find('h4 i')
        .map((_, el) => $(el).text().trim())
        .get();

      // Extract chapter, author, and genres
      const chapter = h4Elements[0] || '';
      const author = h4Elements[1] || 'Đang Cập Nhật';
      const genres = h4Elements[2]
        ? h4Elements[2].split(',').map((g) => g.trim())
        : [];

      comics.push({
        id,
        title,
        url: `https://nettruyenrr.com${href}`,
        chapter,
        author,
        genres,
        thumbnail,
      });
    });

    return comics;
  }
}
