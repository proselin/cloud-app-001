import { Extractor } from './extractor';
import { InfoExtractedResult$1, RawCrawledChapter } from '../../common';
import { NettruyenHttpService } from '../services/nettruyen-http.service';
import { RpcException } from '@nestjs/microservices';

export class ExtractNettruyenImpl implements Extractor<InfoExtractedResult$1> {
  private http!: NettruyenHttpService;
  private url!: string;
  private htmlContent!: string;
  private domain!: string;
  private comicId!: string;
  private comicSlug!: string;

  setHttp(http: NettruyenHttpService) {
    this.http = http;
    return this
  }

  setHtmlContent(htmlContent: string) {
    this.htmlContent = htmlContent;
    return this
  }

  setUrl(url: string) {
    this.url = url;
    return this
  }

  private extractSlug() {
    const slugPattern = /gOpts\.comicSlug\s*=\s*['"]([^'"]*)['"];/g;
    const slugMatch = slugPattern.exec(this.htmlContent);
    if (!slugMatch || !slugMatch[1]) throw new Error('slug is not found !!');
    return slugMatch[1];
  }

  private extractTitle() {
    const namePattern = /gOpts\.comicName\s*=\s*['"]([^'"]*)['"];/g;
    const nameMatch = namePattern.exec(this.htmlContent);
    if (!nameMatch || !nameMatch[1]) throw new Error('Header is not found !!');
    return nameMatch[1];
  }

  private extractId() {
    const idPattern = /gOpts\.comicId\s*=\s*['"]([^'"]*)['"];/g;
    const idMatch = idPattern.exec(this.htmlContent);
    if (!idMatch || !idMatch[1]) throw new Error('comicId is not found !!');
    return idMatch[1];
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

  // from main.js nettruyen
  private generateChapterUrl(comicSlug: string, chapter_slug: string) {
    return `/truyen-tranh/${comicSlug}/${chapter_slug}`;
  }

  private extractThumb() {
    //Extract thumb url
    const thumbImageRegex = /<img[^>]*data-src=["']([^"]*)["']/g;
    const thumbMatch = thumbImageRegex.exec(this.htmlContent);
    if (!thumbMatch || !thumbMatch[1]) {
      throw new Error('Not found thumb url !!');
    }
    return thumbMatch[1];
  }

  private validateInput() {
    if (!this.htmlContent) {
      throw new Error('Missing Html content');
    }
    if (!this.url) {
      throw new Error('Missing URL content');
    }
    if (!this.http) {
      throw new Error('Missing HTTP Service');
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
