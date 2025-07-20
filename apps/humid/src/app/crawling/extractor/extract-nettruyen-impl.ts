import { Extractor } from './extractor';
import { InfoExtractedResult$1, RawCrawledChapter } from '../../common';
import { NettruyenHttpService } from '../../http/nettruyen-http.service';
import { Logger } from '@nestjs/common';

export class ExtractNettruyenImpl implements Extractor<InfoExtractedResult$1> {
  private http!: NettruyenHttpService;
  private url!: string;
  private htmlContent!: string;
  private domain!: string;
  private comicId!: string;
  private comicSlug!: string;
  private logger = new Logger(ExtractNettruyenImpl.name);

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
    // Search for gOpts.comicSlug in the HTML content using regex
    const slugMatch = this.htmlContent.match(
      /gOpts\.comicSlug\s*=\s*['"]([^'"]*)['"];?\s*/
    );

    if (!slugMatch || !slugMatch[1]) {
      throw new Error('slug is not found !!');
    }

    return slugMatch[1];
  }

  private extractTitle() {
    // Search for gOpts.comicName in the HTML content using regex
    const titleMatch = this.htmlContent.match(
      /gOpts\.comicName\s*=\s*['"]([^'"]*)['"];?\s*/
    );

    if (!titleMatch || !titleMatch[1]) {
      throw new Error('Header is not found !!');
    }

    return titleMatch[1];
  }

  private extractId() {
    // Search for gOpts.comicId in the HTML content using regex
    // Match both quoted strings and numeric values with flexible whitespace
    const idMatch = this.htmlContent.match(
      /gOpts\.comicId\s*=\s*(?:['"]([^'"]*)['"]|(\d+))\s*;/
    );

    if (!idMatch || (!idMatch[1] && !idMatch[2])) {
      throw new Error('comicId is not found !!');
    }

    return idMatch[1] || idMatch[2];
  }

  private extractThumb() {
    // Search for image-thumb img with data-src attribute using regex
    let thumbMatch = this.htmlContent.match(
      /<img[^>]+class="[^"]*image-thumb[^"]*"[^>]+data-src="([^"]+)"/i
    );

    // If data-src not found, try to find src attribute
    if (!thumbMatch || !thumbMatch[1]) {
      thumbMatch = this.htmlContent.match(
        /<img[^>]+class="[^"]*image-thumb[^"]*"[^>]+src="([^"]+)"/i
      );
    }

    // Alternative pattern: look for any img inside image-thumb class container
    if (!thumbMatch || !thumbMatch[1]) {
      const containerMatch = this.htmlContent.match(
        /<[^>]+class="[^"]*image-thumb[^"]*"[^>]*>(.*?)<\/[^>]+>/is
      );
      if (containerMatch && containerMatch[1]) {
        const imgMatch = containerMatch[1].match(
          /<img[^>]+(?:data-src|src)="([^"]+)"/i
        );
        if (imgMatch && imgMatch[1]) {
          thumbMatch = imgMatch;
        }
      }
    }

    if (!thumbMatch || !thumbMatch[1]) {
      throw new Error('Not found thumb url !!');
    }

    return thumbMatch[1];
  }

  private async extractChapter(): Promise<RawCrawledChapter[]> {
    return this.http
      .getChapterList(this.domain, this.comicSlug, this.comicId)
      .then((r) => {
        return r.data.data.map((item) => {
          return {
            href: `${this.domain}/${this.generateChapterUrl(
              this.comicSlug,
              item.chapter_slug,
              item.chapter_id.toString()
            )}`,
            chapterNumber: item.chapter_num + '',
          } satisfies RawCrawledChapter;
        });
      });
  }

  private generateChapterUrl(comicSlug: string, chapter_slug: string, id: string) {
    return `/truyen-tranh/${comicSlug}/${chapter_slug}/${id}`
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
    try {
      this.validateInput();

      this.domain = new URL(this.url).origin;
      this.comicId = this.extractId();
      this.comicSlug = this.extractSlug();
      const chapters = await this.extractChapter();
      return {
        title: this.extractTitle(),
        thumbUrl: this.extractThumb(),
        chapters,
        slug: this.comicSlug,
        comicId: this.comicId,
        domain: this.domain,
      } satisfies InfoExtractedResult$1;
    } catch (error) {
      this.logger.error(
        error
      );
      throw error;
    }
  }
}
