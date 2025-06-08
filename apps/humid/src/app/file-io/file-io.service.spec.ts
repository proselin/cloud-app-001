import { Test, TestingModule } from '@nestjs/testing';
import { FileIoService } from './file-io.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import fs from 'node:fs';
import { resolve } from 'node:path';

// Mock the fs module
jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
  },
}));

jest.mock('node:path', () => ({
  resolve: jest.fn(),
}));

// Mock Utils
jest.mock('../utils', () => ({
  Utils: {
    getFileExtensionFromContentType: jest.fn(),
  },
}));

import { Utils } from '../utils';

describe('FileIoService', () => {
  let service: FileIoService;
  let configService: ConfigService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockFs: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockResolve: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileIoService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('/test/images'),
          },
        },
      ],
    }).compile();
    service = module.get<FileIoService>(FileIoService);
    configService = module.get<ConfigService>(ConfigService);

    // Ensure the service is properly instantiated and config is called
    expect(service).toBeDefined();
    expect(configService.getOrThrow).toHaveBeenCalledWith('file.img-location');

    mockFs = fs as jest.Mocked<typeof fs>;
    mockResolve = resolve as jest.MockedFunction<typeof resolve>;

    // Don't clear mocks here since we need to verify the config call
  });
  describe('saveImageFile', () => {
    beforeEach(() => {
      // Clear mocks for fs operations but not config service
      mockFs.existsSync.mockClear();
      mockFs.promises.mkdir.mockClear();
      mockFs.promises.writeFile.mockClear();
      mockResolve.mockClear();
    });

    it('should save image file successfully when directory exists', async () => {
      const fileName = 'test-image.jpg';
      const buffer = Buffer.from('test image data');
      const resolvedPath = '/test/images/test-image.jpg';

      mockFs.existsSync.mockReturnValue(true);
      mockResolve.mockReturnValue(resolvedPath);
      mockFs.promises.writeFile.mockResolvedValue(undefined);

      await service.saveImageFile(fileName, buffer);

      expect(mockFs.existsSync).toHaveBeenCalledWith('/test/images');
      expect(mockFs.promises.mkdir).not.toHaveBeenCalled();
      expect(mockResolve).toHaveBeenCalledWith('/test/images', fileName);
      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(
        resolvedPath,
        buffer
      );
    });

    it('should create directory and save file when directory does not exist', async () => {
      const fileName = 'test-image.jpg';
      const buffer = Buffer.from('test image data');
      const resolvedPath = '/test/images/test-image.jpg';

      mockFs.existsSync.mockReturnValue(false);
      mockResolve.mockReturnValue(resolvedPath);
      mockFs.promises.mkdir.mockResolvedValue(undefined);
      mockFs.promises.writeFile.mockResolvedValue(undefined);

      await service.saveImageFile(fileName, buffer);

      expect(mockFs.existsSync).toHaveBeenCalledWith('/test/images');
      expect(mockFs.promises.mkdir).toHaveBeenCalledWith('/test/images');
      expect(mockResolve).toHaveBeenCalledWith('/test/images', fileName);
      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(
        resolvedPath,
        buffer
      );
    });

    it('should handle write file errors', async () => {
      const fileName = 'test-image.jpg';
      const buffer = Buffer.from('test image data');
      const error = new Error('Write failed');

      mockFs.existsSync.mockReturnValue(true);
      mockResolve.mockReturnValue('/test/images/test-image.jpg');
      mockFs.promises.writeFile.mockRejectedValue(error);

      await expect(service.saveImageFile(fileName, buffer)).rejects.toThrow(
        'Write failed'
      );
    });

    it('should handle mkdir errors', async () => {
      const fileName = 'test-image.jpg';
      const buffer = Buffer.from('test image data');
      const error = new Error('Mkdir failed');

      mockFs.existsSync.mockReturnValue(false);
      mockFs.promises.mkdir.mockRejectedValue(error);

      await expect(service.saveImageFile(fileName, buffer)).rejects.toThrow(
        'Mkdir failed'
      );
    });
  });
  describe('readImageFile', () => {
    beforeEach(() => {
      // Clear mocks for fs operations
      mockFs.promises.readFile.mockClear();
    });

    it('should read image file successfully', async () => {
      const fileName = 'test-image.jpg';
      const expectedBuffer = Buffer.from('test image data');

      mockFs.promises.readFile.mockResolvedValue(expectedBuffer);

      const result = await service.readImageFile(fileName);

      expect(mockFs.promises.readFile).toHaveBeenCalledWith(
        '/test/images' + fileName
      );
      expect(result).toBe(expectedBuffer);
    });

    it('should handle read file errors', async () => {
      const fileName = 'test-image.jpg';
      const error = new Error('Read failed');

      mockFs.promises.readFile.mockRejectedValue(error);

      await expect(service.readImageFile(fileName)).rejects.toThrow(
        'Read failed'
      );
    });
  });

  describe('generateFileName', () => {
    beforeEach(() => {
      // Mock Date.now() to return a consistent value
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should generate filename with valid content type', () => {
      const prefixFileName = 'test-image';
      const contentType = 'image/jpeg';

      (Utils.getFileExtensionFromContentType as jest.Mock).mockReturnValue(
        'jpg'
      );

      const result = service.generateFileName(prefixFileName, contentType);

      expect(Utils.getFileExtensionFromContentType).toHaveBeenCalledWith(
        contentType
      );
      expect(result).toMatch(/^test-image-\w+\.jpg$/);
    });

    it('should throw BadRequestException when content type is null', () => {
      const prefixFileName = 'test-image';
      const contentType = null;

      expect(() =>
        service.generateFileName(prefixFileName, contentType)
      ).toThrow(new BadRequestException('Content type must be a string'));
    });

    it('should throw BadRequestException when extension is not supported', () => {
      const prefixFileName = 'test-image';
      const contentType = 'unsupported/type';

      (Utils.getFileExtensionFromContentType as jest.Mock).mockReturnValue(
        null
      );

      expect(() =>
        service.generateFileName(prefixFileName, contentType)
      ).toThrow(new BadRequestException('Unsupported content type'));
    });

    it('should generate different hash for different timestamps', () => {
      const prefixFileName = 'test-image';
      const contentType = 'image/png';

      (Utils.getFileExtensionFromContentType as jest.Mock).mockReturnValue(
        'png'
      );

      // First call
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
      const result1 = service.generateFileName(prefixFileName, contentType);

      // Second call with different timestamp
      jest.spyOn(Date, 'now').mockReturnValue(9876543210);
      const result2 = service.generateFileName(prefixFileName, contentType);

      expect(result1).not.toBe(result2);
      expect(result1).toMatch(/^test-image-\w+\.png$/);
      expect(result2).toMatch(/^test-image-\w+\.png$/);
    });
  });
});
