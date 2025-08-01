import { resolve } from 'node:path';

export abstract class Utils {
  public static extensionMap: Record<string, string> = {
    jpg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    svg: 'image/svg+xml',
  };

  public static contentTypeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/svg+xml': 'svg',
  };
  public static getFileExtensionFromContentType(
    contentType: string
  ): string | null {
    // Handle content type with parameters (e.g., "image/jpeg; charset=utf-8")
    // and trim whitespace
    const cleanContentType = contentType.trim().split(';')[0].trim();
    return Utils.contentTypeMap[cleanContentType] || null;
  }

  public static fromConfigToPath(pathInConfig: string) {
    return resolve(...pathInConfig.split('/'));
  }
}
