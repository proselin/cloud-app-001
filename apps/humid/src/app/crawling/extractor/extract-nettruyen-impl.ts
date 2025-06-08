import { Extractor } from './extractor';
import { InfoExtractedResult$1, RawCrawledChapter } from '../../common';
import { NettruyenHttpService } from '../../http/nettruyen-http.service';
import * as cheerio from 'cheerio';

export class ExtractNettruyenImpl implements Extractor<InfoExtractedResult$1> {
  private http!: NettruyenHttpService;
  private url!: string;
  private htmlContent!: string;
  private domain!: string;
  private comicId!: string;
  private comicSlug!: string;

  setHttp(http: NettruyenHttpService) {
    this.http = http;
    return this;
  }

  setHtmlContent(htmlContent: string) {
    this.htmlContent = htmlContent;
    return this;
  }

  setUrl(url: string) {
    this.url = url;
    return this;
  }

  private extractSlug() {
    const $ = cheerio.load(this.htmlContent);
    let slug: string | undefined;

    // Search for gOpts.comicSlug in script tags
    $('script').each((_, element) => {
      const scriptContent = $(element).html();
      if (scriptContent && scriptContent.includes('gOpts.comicSlug')) {
        const slugMatch = scriptContent.match(
          /gOpts\.comicSlug\s*=\s*['"]([^'"]*)['"]s*;/
        );
        if (slugMatch && slugMatch[1]) {
          slug = slugMatch[1];
          return false; // Break the loop
        }
      }
    });

    if (!slug) {
      throw new Error('slug is not found !!');
    }
    return slug;
  }

  private extractTitle() {
    const $ = cheerio.load(this.htmlContent);
    let title: string | undefined;

    // Search for gOpts.comicName in script tags
    $('script').each((_, element) => {
      const scriptContent = $(element).html();
      if (scriptContent && scriptContent.includes('gOpts.comicName')) {
        const nameMatch = scriptContent.match(
          /gOpts\.comicName\s*=\s*['"]([^'"]*)['"]s*;/
        );
        if (nameMatch && nameMatch[1]) {
          title = nameMatch[1];
          return false; // Break the loop
        }
      }
    });

    if (!title) {
      throw new Error('Header is not found !!');
    }
    return title;
  }

  private extractId() {
    const $ = cheerio.load(this.htmlContent);
    let id: string | undefined;

    // Search for gOpts.comicId in script tags
    $('script').each((_, element) => {
      const scriptContent = $(element).html();
      if (scriptContent && scriptContent.includes('gOpts.comicId')) {
        // Match both quoted strings and numeric values with flexible whitespace
        const idMatch = scriptContent.match(
          /gOpts\.comicId\s*=\s*(?:['"]([^'"]*)['"]|(\d+))\s*;/
        );
        if (idMatch && (idMatch[1] || idMatch[2])) {
          id = idMatch[1] || idMatch[2];
          return false; // Break the loop
        }
      }
    });

    if (!id) {
      throw new Error('comicId is not found !!');
    }
    return id;
  }

  private extractThumb() {
    const $ = cheerio.load(this.htmlContent);
    let thumbUrl = $('.detail-content-image img').first().attr('data-src');

    // Fallback to src attribute if data-src is not found
    if (!thumbUrl) {
      thumbUrl = $('.detail-content-image img').first().attr('src');
    }

    if (!thumbUrl) {
      throw new Error('Not found thumb url !!');
    }
    return thumbUrl;
  }

  private async extractChapter(): Promise<RawCrawledChapter[]> {
    return this.http
      .getChapterList(this.domain, this.comicSlug, this.comicId)
      .then((r) => {
        return r.data.data.map((item) => {
          return {
            href: `${this.domain}/${this.generateChapterUrl(
              this.comicSlug,
              item.chapter_slug
            )}`,
            chapterNumber: item.chapter_num + '',
          } satisfies RawCrawledChapter;
        });
      });
  }

  private generateChapterUrl(comicSlug: string, chapter_slug: string) {
    return `/truyen-tranh/${comicSlug}/${chapter_slug}`;
  }

  private validateInput() {
    if (!this.http) {
      throw new Error('Missing HTTP Service');
    }
    if (!this.url) {
      throw new Error('Missing URL content');
    }
    if (!this.htmlContent) {
      throw new Error('Missing Html content');
    }
  }

  async extract() {
    this.validateInput();

    this.domain = new URL(this.url).origin;
    this.comicId = this.extractId();
    this.comicSlug = this.extractSlug();
    const chapters = await this.extractChapter();
    return {
      title: this.extractTitle(),
      thumbUrl: this.extractThumb(),
      chapters,
      slug: this.extractSlug(),
      comicId: this.comicId,
      domain: this.domain,
    } satisfies InfoExtractedResult$1;
  }
}
