import { ExtractNettruyenImpl } from './extract-nettruyen-impl';

describe('ExtractNettruyenImpl', () => {
  let extractor: ExtractNettruyenImpl;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHttpService: any;

  const mockHtmlContent = `
    <html>
      <head>
        <script>
          var gOpts = {};
          gOpts.comicId = "12345";
          gOpts.comicSlug = "test-comic-slug";
          gOpts.comicName = "Test Comic Name";
        </script>
      </head>
      <body>
        <div class="detail-info">
          <div class="title-detail">Test Comic Title</div>
          <div class="detail-content">
            <div class="detail-content-image">
              <img class="image-thumb" data-src="https://example.com/thumb.jpg" />
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  beforeEach(() => {
    mockHttpService = {
      getChapterList: jest.fn(),
    };

    extractor = new ExtractNettruyenImpl();
  });

  describe('setHttp', () => {
    it('should set the http service and return the instance', () => {
      const result = extractor.setHttp(mockHttpService);
      expect(result).toBe(extractor);
    });
  });

  describe('setHtmlContent', () => {
    it('should set the html content and return the instance', () => {
      const htmlContent = '<html></html>';
      const result = extractor.setHtmlContent(htmlContent);
      expect(result).toBe(extractor);
    });
  });

  describe('setUrl', () => {
    it('should set the url and return the instance', () => {
      const url = 'https://example.com';
      const result = extractor.setUrl(url);
      expect(result).toBe(extractor);
    });
  });
  describe('extract', () => {
    beforeEach(() => {
      const mockChapterResponse = {
        data: {
          data: [
            {
              chapter_num: 1,
              chapter_slug: 'chapter-1',
            },
            {
              chapter_num: 2,
              chapter_slug: 'chapter-2',
            },
          ],
        },
      };

      mockHttpService.getChapterList.mockResolvedValue(mockChapterResponse);
    });

    it('should successfully extract comic information', async () => {
      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(mockHtmlContent)
        .setUrl('https://example.com/comic/test-comic');

      const result = await extractor.extract();

      expect(result).toEqual({
        title: 'Test Comic Name',
        thumbUrl: 'https://example.com/thumb.jpg',
        chapters: [
          {
            href: 'https://example.com//truyen-tranh/test-comic-slug/chapter-1',
            chapterNumber: '1',
          },
          {
            href: 'https://example.com//truyen-tranh/test-comic-slug/chapter-2',
            chapterNumber: '2',
          },
        ],
        slug: 'test-comic-slug',
        comicId: '12345',
        domain: 'https://example.com',
      });
    });

    it('should successfully extract comic information with numeric ID', async () => {
      const htmlWithNumericId = `
        <html>
          <head>
            <script>
              var gOpts = {};
              gOpts.comicId = 98765;
              gOpts.comicSlug = "numeric-id-comic";
              gOpts.comicName = "Numeric ID Comic";
            </script>
          </head>
          <body>
            <div class="detail-info">
              <div class="title-detail">Numeric Comic Title</div>
              <div class="detail-content">
                <div class="detail-content-image">
                  <img class="image-thumb" data-src="https://example.com/numeric-thumb.jpg" />
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithNumericId)
        .setUrl('https://example.com/comic/numeric-test');

      const result = await extractor.extract();

      expect(result).toEqual({
        title: 'Numeric ID Comic',
        thumbUrl: 'https://example.com/numeric-thumb.jpg',
        chapters: [
          {
            href: 'https://example.com//truyen-tranh/numeric-id-comic/chapter-1',
            chapterNumber: '1',
          },
          {
            href: 'https://example.com//truyen-tranh/numeric-id-comic/chapter-2',
            chapterNumber: '2',
          },
        ],
        slug: 'numeric-id-comic',
        comicId: '98765',
        domain: 'https://example.com',
      });
    });

    it('should successfully extract comic with src attribute image', async () => {
      const htmlWithSrcImage = `
        <html>
          <head>
            <script>
              var gOpts = {};
              gOpts.comicId = "67890";
              gOpts.comicSlug = "src-image-comic";
              gOpts.comicName = "Src Image Comic";
            </script>
          </head>
          <body>
            <div class="detail-info">
              <div class="title-detail">Src Image Title</div>
              <div class="detail-content">
                <div class="detail-content-image">
                  <img class="image-thumb" src="https://example.com/src-thumb.jpg" />
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithSrcImage)
        .setUrl('https://example.com/comic/src-test');

      const result = await extractor.extract();

      expect(result.thumbUrl).toBe('https://example.com/src-thumb.jpg');
      expect(result.title).toBe('Src Image Comic');
      expect(result.slug).toBe('src-image-comic');
      expect(result.comicId).toBe('67890');
    });

    it('should handle multiple script tags during extraction', async () => {
      const htmlWithMultipleScripts = `
        <html>
          <head>
            <script>console.log('first script');</script>
            <script>var otherVars = { test: 'value' };</script>
            <script>
              var gOpts = {};
              gOpts.comicId = "11111";
              gOpts.comicSlug = "multi-script-comic";
              gOpts.comicName = "Multi Script Comic";
            </script>
            <script>console.log('last script');</script>
          </head>
          <body>
            <div class="detail-info">
              <div class="title-detail">Multi Script Title</div>
              <div class="detail-content">
                <div class="detail-content-image">
                  <img class="image-thumb" data-src="https://example.com/multi-thumb.jpg" />
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithMultipleScripts)
        .setUrl('https://example.com/comic/multi-test');

      const result = await extractor.extract();

      expect(result.title).toBe('Multi Script Comic');
      expect(result.slug).toBe('multi-script-comic');
      expect(result.comicId).toBe('11111');
    });

    it('should handle empty chapter list during extraction', async () => {
      const emptyChapterResponse = { data: { data: [] } };
      mockHttpService.getChapterList.mockResolvedValue(emptyChapterResponse);

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(mockHtmlContent)
        .setUrl('https://example.com/comic/empty-chapters');

      const result = await extractor.extract();
      expect(result.chapters).toEqual([]);
    });

    it('should throw error when http service is missing', async () => {
      const newExtractor = new ExtractNettruyenImpl();
      newExtractor
        .setHtmlContent(mockHtmlContent)
        .setUrl('https://example.com/comic/test-comic');

      await expect(newExtractor.extract()).rejects.toThrow(
        'Missing HTTP Service'
      );
    });

    it('should throw error when url is missing', async () => {
      const newExtractor = new ExtractNettruyenImpl();
      newExtractor.setHttp(mockHttpService).setHtmlContent(mockHtmlContent);

      await expect(newExtractor.extract()).rejects.toThrow(
        'Missing URL content'
      );
    });

    it('should throw error when html content is missing', async () => {
      const newExtractor = new ExtractNettruyenImpl();
      newExtractor
        .setHttp(mockHttpService)
        .setUrl('https://example.com/comic/test-comic');

      await expect(newExtractor.extract()).rejects.toThrow(
        'Missing Html content'
      );
    });

    it('should throw error when slug is not found in html', async () => {
      const htmlWithoutSlug =
        '<html><script>var gOpts = {}; gOpts.comicId = "12345"; gOpts.comicName = "Test";</script></html>';
      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithoutSlug)
        .setUrl('https://example.com/comic/test-comic');

      await expect(extractor.extract()).rejects.toThrow('slug is not found !!');
    });

    it('should throw error when title is not found in html', async () => {
      const htmlWithoutTitle =
        '<html><script>var gOpts = {}; gOpts.comicId = "12345"; gOpts.comicSlug = "test-slug";</script></html>';
      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithoutTitle)
        .setUrl('https://example.com/comic/test-comic');

      await expect(extractor.extract()).rejects.toThrow(
        'Header is not found !!'
      );
    });

    it('should throw error when comic ID is not found in html', async () => {
      const htmlWithoutId =
        '<html><script>var gOpts = {}; gOpts.comicSlug = "test-slug"; gOpts.comicName = "Test";</script></html>';
      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithoutId)
        .setUrl('https://example.com/comic/test-comic');

      await expect(extractor.extract()).rejects.toThrow(
        'comicId is not found !!'
      );
    });

    it('should throw error when thumb image is not found', async () => {
      const htmlWithoutThumb =
        '<html><script>var gOpts = {}; gOpts.comicId = "12345"; gOpts.comicSlug = "test-slug"; gOpts.comicName = "Test";</script><body></body></html>';
      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithoutThumb)
        .setUrl('https://example.com/comic/test-comic');

      await expect(extractor.extract()).rejects.toThrow(
        'Not found thumb url !!'
      );
    });

    it('should handle HTTP service errors during chapter extraction', async () => {
      mockHttpService.getChapterList.mockRejectedValue(
        new Error('Network error')
      );

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(mockHtmlContent)
        .setUrl('https://example.com/comic/test-comic');

      await expect(extractor.extract()).rejects.toThrow('Network error');
    });
  });

  describe('individual extraction methods', () => {
    beforeEach(() => {
      extractor
        .setHtmlContent(mockHtmlContent)
        .setUrl('https://example.com/comic/test-comic');
    });

    describe('extractSlug', () => {
      it('should extract slug from script content', () => {
        const result = extractor['extractSlug']();
        expect(result).toBe('test-comic-slug');
      });

      it('should throw error when slug is not found', () => {
        const htmlWithoutSlug =
          '<html><script>var gOpts = {}; gOpts.comicId = "12345";</script></html>';
        extractor.setHtmlContent(htmlWithoutSlug);

        expect(() => extractor['extractSlug']()).toThrow(
          'slug is not found !!'
        );
      });

      it('should handle multiple script tags and find the right one', () => {
        const htmlWithMultipleScripts = `
          <html>
            <script>console.log('test');</script>
            <script>var gOpts = {}; gOpts.comicSlug = "correct-slug";</script>
            <script>var other = 'value';</script>
          </html>
        `;
        extractor.setHtmlContent(htmlWithMultipleScripts);

        const result = extractor['extractSlug']();
        expect(result).toBe('correct-slug');
      });
    });

    describe('extractTitle', () => {
      it('should extract title from script content', () => {
        const result = extractor['extractTitle']();
        expect(result).toBe('Test Comic Name');
      });

      it('should throw error when title is not found', () => {
        const htmlWithoutTitle =
          '<html><script>var gOpts = {}; gOpts.comicId = "12345";</script></html>';
        extractor.setHtmlContent(htmlWithoutTitle);

        expect(() => extractor['extractTitle']()).toThrow(
          'Header is not found !!'
        );
      });

      it('should handle title with special characters', () => {
        const htmlWithSpecialTitle =
          '<html><script>var gOpts = {}; gOpts.comicName = "Tên Truyện Đặc Biệt";</script></html>';
        extractor.setHtmlContent(htmlWithSpecialTitle);

        const result = extractor['extractTitle']();
        expect(result).toBe('Tên Truyện Đặc Biệt');
      });
    });

    describe('extractId', () => {
      it('should extract comic ID from script content', () => {
        const result = extractor['extractId']();
        expect(result).toBe('12345');
      });

      it('should throw error when ID is not found', () => {
        const htmlWithoutId =
          '<html><script>var gOpts = {}; gOpts.comicSlug = "test";</script></html>';
        extractor.setHtmlContent(htmlWithoutId);

        expect(() => extractor['extractId']()).toThrow(
          'comicId is not found !!'
        );
      });
      it('should handle numeric ID correctly', () => {
        const htmlWithNumericId =
          '<html><script>var gOpts = {}; gOpts.comicId = 67890;</script></html>';
        extractor.setHtmlContent(htmlWithNumericId);

        const result = extractor['extractId']();
        expect(result).toBe('67890');
      });
    });

    describe('extractThumb', () => {
      it('should extract thumbnail URL from detail-content-image img', () => {
        const result = extractor['extractThumb']();
        expect(result).toBe('https://example.com/thumb.jpg');
      });

      it('should throw error when thumb is not found', () => {
        const htmlWithoutThumb =
          '<html><body><div class="detail-info"></div></body></html>';
        extractor.setHtmlContent(htmlWithoutThumb);

        expect(() => extractor['extractThumb']()).toThrow(
          'Not found thumb url !!'
        );
      });

      it('should handle img with src attribute instead of data-src', () => {
        const htmlWithSrcThumb = `
          <html>
            <body>
              <div class="detail-info">
                <div class="detail-content">
                  <div class="detail-content-image">
                    <img class="image-thumb" src="https://example.com/thumb-src.jpg" />
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;
        extractor.setHtmlContent(htmlWithSrcThumb);

        const result = extractor['extractThumb']();
        expect(result).toBe('https://example.com/thumb-src.jpg');
      });
    });

    describe('extractChapter', () => {
      beforeEach(() => {
        const mockChapterResponse = {
          data: {
            data: [
              {
                chapter_num: 1,
                chapter_slug: 'chapter-1',
              },
              {
                chapter_num: 2,
                chapter_slug: 'chapter-2',
              },
              {
                chapter_num: 10,
                chapter_slug: 'chapter-10',
              },
            ],
          },
        };

        mockHttpService.getChapterList.mockResolvedValue(mockChapterResponse);
        extractor.setHttp(mockHttpService);
      });
      it('should extract chapters with correct URLs and numbers', async () => {
        // Set up the extractor with all necessary data
        extractor
          .setHtmlContent(mockHtmlContent)
          .setUrl('https://example.com/comic/test-comic');

        // Manually set the properties that would be set during extract()
        extractor['domain'] = 'https://example.com';
        extractor['comicSlug'] = 'test-comic-slug';

        const result = await extractor['extractChapter']();

        expect(result).toEqual([
          {
            href: 'https://example.com//truyen-tranh/test-comic-slug/chapter-1',
            chapterNumber: '1',
          },
          {
            href: 'https://example.com//truyen-tranh/test-comic-slug/chapter-2',
            chapterNumber: '2',
          },
          {
            href: 'https://example.com//truyen-tranh/test-comic-slug/chapter-10',
            chapterNumber: '10',
          },
        ]);
      });

      it('should handle empty chapter list', async () => {
        const emptyChapterResponse = { data: { data: [] } };
        mockHttpService.getChapterList.mockResolvedValue(emptyChapterResponse);

        const result = await extractor['extractChapter']();
        expect(result).toEqual([]);
      });

      it('should handle chapters with decimal numbers', async () => {
        const chapterWithDecimals = {
          data: {
            data: [
              {
                chapter_num: 1.5,
                chapter_slug: 'chapter-1-5',
              },
            ],
          },
        };
        mockHttpService.getChapterList.mockResolvedValue(chapterWithDecimals);

        const result = await extractor['extractChapter']();
        expect(result[0].chapterNumber).toBe('1.5');
      });
    });
    describe('validateInput', () => {
      beforeEach(() => {
        // Reset extractor for each validateInput test
        extractor = new ExtractNettruyenImpl();
      });

      it('should validate successfully when all inputs are present', () => {
        extractor
          .setHttp(mockHttpService)
          .setHtmlContent(mockHtmlContent)
          .setUrl('https://example.com/comic/test');

        expect(() => extractor['validateInput']()).not.toThrow();
      });

      it('should throw error when HTTP service is missing', () => {
        extractor
          .setHtmlContent(mockHtmlContent)
          .setUrl('https://example.com/comic/test');

        expect(() => extractor['validateInput']()).toThrow(
          'Missing HTTP Service'
        );
      });

      it('should throw error when HTML content is missing', () => {
        extractor
          .setHttp(mockHttpService)
          .setUrl('https://example.com/comic/test');

        expect(() => extractor['validateInput']()).toThrow(
          'Missing Html content'
        );
      });

      it('should throw error when URL is missing', () => {
        extractor.setHttp(mockHttpService).setHtmlContent(mockHtmlContent);

        expect(() => extractor['validateInput']()).toThrow(
          'Missing URL content'
        );
      });
    });
  });

  // Add specific unit tests that force coverage of individual methods
  describe('Individual Method Coverage Tests', () => {
    beforeEach(() => {
      const mockChapterResponse = {
        data: {
          data: [
            {
              chapter_num: 1,
              chapter_slug: 'chapter-1',
            },
            {
              chapter_num: 2,
              chapter_slug: 'chapter-2',
            },
          ],
        },
      };

      mockHttpService.getChapterList.mockResolvedValue(mockChapterResponse);
    });

    it('should test extractSlug method execution through extract', async () => {
      const htmlWithMultipleSlugFormats = `
        <html>
          <head>
            <script>
              var gOpts = {};
              gOpts.comicId = "12345";
              gOpts.comicSlug = "test-comic-slug";
              gOpts.comicName = "Test Comic Name";
            </script>
            <script>
              // Some other script
              var otherVar = "test";
            </script>
          </head>
          <body>
            <div class="detail-content-image">
              <img class="image-thumb" data-src="https://example.com/thumb.jpg" />
            </div>
          </body>
        </html>
      `;

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithMultipleSlugFormats)
        .setUrl('https://example.com/comic/test-comic');

      const result = await extractor.extract();
      expect(result.slug).toBe('test-comic-slug');
    });

    it('should test extractTitle method execution through extract', async () => {
      const htmlWithTitleInScript = `
        <html>
          <head>
            <script>
              var gOpts = {};
              gOpts.comicId = "12345";
              gOpts.comicSlug = "test-comic-slug";
              gOpts.comicName = "Test Comic Title From Script";
            </script>
          </head>
          <body>
            <div class="detail-content-image">
              <img class="image-thumb" data-src="https://example.com/thumb.jpg" />
            </div>
          </body>
        </html>
      `;

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithTitleInScript)
        .setUrl('https://example.com/comic/test-comic');

      const result = await extractor.extract();
      expect(result.title).toBe('Test Comic Title From Script');
    });

    it('should test extractId method with string format', async () => {
      const htmlWithStringId = `
        <html>
          <head>
            <script>
              var gOpts = {};
              gOpts.comicId = "string-12345";
              gOpts.comicSlug = "test-comic-slug";
              gOpts.comicName = "Test Comic Name";
            </script>
          </head>
          <body>
            <div class="detail-content-image">
              <img class="image-thumb" data-src="https://example.com/thumb.jpg" />
            </div>
          </body>
        </html>
      `;

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithStringId)
        .setUrl('https://example.com/comic/test-comic');

      const result = await extractor.extract();
      expect(result.comicId).toBe('string-12345');
    });

    it('should test extractId method with numeric format', async () => {
      const htmlWithNumericId = `
        <html>
          <head>
            <script>
              var gOpts = {};
              gOpts.comicId = 98765;
              gOpts.comicSlug = "test-comic-slug";
              gOpts.comicName = "Test Comic Name";
            </script>
          </head>
          <body>
            <div class="detail-content-image">
              <img class="image-thumb" data-src="https://example.com/thumb.jpg" />
            </div>
          </body>
        </html>
      `;

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithNumericId)
        .setUrl('https://example.com/comic/test-comic');

      const result = await extractor.extract();
      expect(result.comicId).toBe('98765');
    });

    it('should test extractThumb method with data-src attribute', async () => {
      const htmlWithDataSrc = `
        <html>
          <head>
            <script>
              var gOpts = {};
              gOpts.comicId = "12345";
              gOpts.comicSlug = "test-comic-slug";
              gOpts.comicName = "Test Comic Name";
            </script>
          </head>
          <body>
            <div class="detail-content-image">
              <img class="image-thumb" data-src="https://example.com/data-src-thumb.jpg" />
            </div>
          </body>
        </html>
      `;

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithDataSrc)
        .setUrl('https://example.com/comic/test-comic');

      const result = await extractor.extract();
      expect(result.thumbUrl).toBe('https://example.com/data-src-thumb.jpg');
    });

    it('should test extractThumb method with fallback to src attribute', async () => {
      const htmlWithSrcFallback = `
        <html>
          <head>
            <script>
              var gOpts = {};
              gOpts.comicId = "12345";
              gOpts.comicSlug = "test-comic-slug";
              gOpts.comicName = "Test Comic Name";
            </script>
          </head>
          <body>
            <div class="detail-content-image">
              <img class="image-thumb" src="https://example.com/src-thumb.jpg" />
            </div>
          </body>
        </html>
      `;

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithSrcFallback)
        .setUrl('https://example.com/comic/test-comic');

      const result = await extractor.extract();
      expect(result.thumbUrl).toBe('https://example.com/src-thumb.jpg');
    });

    it('should test extractChapter method execution with valid response', async () => {
      const customChapterResponse = {
        data: {
          data: [
            {
              chapter_num: 1,
              chapter_slug: 'custom-chapter-1',
            },
            {
              chapter_num: 2,
              chapter_slug: 'custom-chapter-2',
            },
            {
              chapter_num: 3,
              chapter_slug: 'custom-chapter-3',
            },
          ],
        },
      };

      mockHttpService.getChapterList.mockResolvedValue(customChapterResponse);

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(mockHtmlContent)
        .setUrl('https://example.com/comic/test-comic');

      const result = await extractor.extract();
      expect(result.chapters).toHaveLength(3);
      expect(result.chapters[0].chapterNumber).toBe('1');
      expect(result.chapters[1].href).toContain('custom-chapter-2');
    });

    it('should test generateChapterUrl method through extractChapter', async () => {
      const specialChapterResponse = {
        data: {
          data: [
            {
              chapter_num: 99,
              chapter_slug: 'special-chapter-slug',
            },
          ],
        },
      };

      mockHttpService.getChapterList.mockResolvedValue(specialChapterResponse);

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(mockHtmlContent)
        .setUrl('https://example.com/comic/test-comic');

      const result = await extractor.extract();
      expect(result.chapters[0].href).toBe(
        'https://example.com//truyen-tranh/test-comic-slug/special-chapter-slug'
      );
    });

    it('should test validateInput method through missing http', async () => {
      const newExtractor = new ExtractNettruyenImpl();
      newExtractor
        .setHtmlContent(mockHtmlContent)
        .setUrl('https://example.com/comic/test-comic');

      await expect(newExtractor.extract()).rejects.toThrow(
        'Missing HTTP Service'
      );
    });

    it('should test validateInput method through missing url', async () => {
      const newExtractor = new ExtractNettruyenImpl();
      newExtractor.setHttp(mockHttpService).setHtmlContent(mockHtmlContent);

      await expect(newExtractor.extract()).rejects.toThrow(
        'Missing URL content'
      );
    });

    it('should test validateInput method through missing html', async () => {
      const newExtractor = new ExtractNettruyenImpl();
      newExtractor
        .setHttp(mockHttpService)
        .setUrl('https://example.com/comic/test-comic');

      await expect(newExtractor.extract()).rejects.toThrow(
        'Missing Html content'
      );
    });

    it('should test domain extraction from URL', async () => {
      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(mockHtmlContent)
        .setUrl('https://test-domain.com/comic/test-comic');

      const result = await extractor.extract();
      expect(result.domain).toBe('https://test-domain.com');
    });
    it('should test complex script parsing with extra whitespace', async () => {
      const htmlWithWhitespace = `
        <html>
          <head>
            <script>
              var gOpts = {};
              gOpts.comicId    =    "12345"   ;
              gOpts.comicSlug   =   "test-comic-slug"  ;
              gOpts.comicName  =  "Test Comic Name"   ;
            </script>
          </head>
          <body>
            <div class="detail-content-image">
              <img class="image-thumb" data-src="https://example.com/thumb.jpg" />
            </div>
          </body>
        </html>
      `;

      extractor
        .setHttp(mockHttpService)
        .setHtmlContent(htmlWithWhitespace)
        .setUrl('https://example.com/comic/test-comic');

      const result = await extractor.extract();
      expect(result.comicId).toBe('12345');
      expect(result.slug).toBe('test-comic-slug');
      expect(result.title).toBe('Test Comic Name');
    });
  });
});
