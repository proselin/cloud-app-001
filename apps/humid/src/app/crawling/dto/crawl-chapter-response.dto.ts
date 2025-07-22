import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CrawlChapterResponseSchema = z.object({
  chapterId: z.number().int(),
  chapterNumber: z.string(),
  chapterTitle: z.string(),
  chapterUrl: z.string(),
  position: z.number().int(),
  crawlStatus: z.string(),
  comicId: z.number().int(),
  comicTitle: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export class CrawlChapterResponseDto extends createZodDto(CrawlChapterResponseSchema) {}
