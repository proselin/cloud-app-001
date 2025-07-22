import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CrawlChapterRequestSchema = z.object({
  chapterId: z.number().int().positive('Chapter ID must be a positive integer'),
});

export class CrawlChapterRequestDto extends createZodDto(CrawlChapterRequestSchema) {}
