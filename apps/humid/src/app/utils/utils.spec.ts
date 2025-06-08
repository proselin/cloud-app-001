import { Utils } from './utils';

describe('Utils', () => {
  describe('getFileExtensionFromContentType', () => {
    it('should return correct extension for jpeg content type', () => {
      const result = Utils.getFileExtensionFromContentType('image/jpeg');
      expect(result).toBe('jpg');
    });

    it('should return correct extension for png content type', () => {
      const result = Utils.getFileExtensionFromContentType('image/png');
      expect(result).toBe('png');
    });

    it('should return correct extension for gif content type', () => {
      const result = Utils.getFileExtensionFromContentType('image/gif');
      expect(result).toBe('gif');
    });

    it('should return correct extension for webp content type', () => {
      const result = Utils.getFileExtensionFromContentType('image/webp');
      expect(result).toBe('webp');
    });

    it('should return correct extension for bmp content type', () => {
      const result = Utils.getFileExtensionFromContentType('image/bmp');
      expect(result).toBe('bmp');
    });

    it('should return correct extension for tiff content type', () => {
      const result = Utils.getFileExtensionFromContentType('image/tiff');
      expect(result).toBe('tiff');
    });

    it('should return correct extension for svg content type', () => {
      const result = Utils.getFileExtensionFromContentType('image/svg+xml');
      expect(result).toBe('svg');
    });

    it('should return null for unsupported content type', () => {
      const result = Utils.getFileExtensionFromContentType('application/pdf');
      expect(result).toBeNull();
    });

    it('should return null for empty string content type', () => {
      const result = Utils.getFileExtensionFromContentType('');
      expect(result).toBeNull();
    });

    it('should return null for invalid content type', () => {
      const result = Utils.getFileExtensionFromContentType('invalid/type');
      expect(result).toBeNull();
    });

    it('should return null for case-sensitive content type variations', () => {
      const result1 = Utils.getFileExtensionFromContentType('IMAGE/JPEG');
      const result2 = Utils.getFileExtensionFromContentType('Image/Png');
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should handle content type with charset parameter', () => {
      const result = Utils.getFileExtensionFromContentType(
        'image/jpeg; charset=utf-8'
      );
      expect(result).toBe('jpg');
    });

    it('should handle content type with additional parameters', () => {
      const result = Utils.getFileExtensionFromContentType(
        'image/png; boundary=something'
      );
      expect(result).toBe('png');
    });

    it('should handle whitespace in content type', () => {
      const result1 = Utils.getFileExtensionFromContentType(' image/gif ');
      const result2 = Utils.getFileExtensionFromContentType('image/webp ');
      const result3 = Utils.getFileExtensionFromContentType(' image/bmp');

      expect(result1).toBe('gif');
      expect(result2).toBe('webp');
      expect(result3).toBe('bmp');
    });
  });
  describe('fromConfigToPath', () => {
    it('should convert config path with forward slashes to resolved path', () => {
      const configPath = 'home/user/documents/images';

      const result = Utils.fromConfigToPath(configPath);

      expect(typeof result).toBe('string');
      expect(result).toBeDefined();
      expect(result).toContain('home');
      expect(result).toContain('user');
      expect(result).toContain('documents');
      expect(result).toContain('images');
    });

    it('should handle single directory path', () => {
      const configPath = 'images';

      const result = Utils.fromConfigToPath(configPath);

      expect(typeof result).toBe('string');
      expect(result).toBeDefined();
      expect(result).toContain('images');
    });

    it('should handle empty path', () => {
      const configPath = '';

      const result = Utils.fromConfigToPath(configPath);

      expect(typeof result).toBe('string');
      expect(result).toBeDefined();
    });

    it('should handle path with nested directories', () => {
      const configPath = 'app/data/storage/images/thumbnails';

      const result = Utils.fromConfigToPath(configPath);

      expect(result).toContain('app');
      expect(result).toContain('data');
      expect(result).toContain('storage');
      expect(result).toContain('images');
      expect(result).toContain('thumbnails');
    });

    it('should handle path with single character directory names', () => {
      const configPath = 'a/b/c';

      const result = Utils.fromConfigToPath(configPath);

      expect(result).toContain('a');
      expect(result).toContain('b');
      expect(result).toContain('c');
    });

    it('should return absolute path', () => {
      const configPath = 'test/path';

      const result = Utils.fromConfigToPath(configPath);

      // On Windows, absolute paths start with drive letter, on Unix with '/'
      expect(result.length).toBeGreaterThan(configPath.length);
    });
  });

  describe('static properties', () => {
    it('should have correct extensionMap', () => {
      expect(Utils.extensionMap).toEqual({
        jpg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        bmp: 'image/bmp',
        tiff: 'image/tiff',
        svg: 'image/svg+xml',
      });
    });

    it('should have correct contentTypeMap', () => {
      expect(Utils.contentTypeMap).toEqual({
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/tiff': 'tiff',
        'image/svg+xml': 'svg',
      });
    });

    it('should have matching extension and content type mappings', () => {
      // Verify that extensionMap and contentTypeMap are inverse of each other
      Object.entries(Utils.extensionMap).forEach(([ext, contentType]) => {
        expect(Utils.contentTypeMap[contentType]).toBe(ext);
      });

      Object.entries(Utils.contentTypeMap).forEach(([contentType, ext]) => {
        expect(Utils.extensionMap[ext]).toBe(contentType);
      });
    });
  });
});
