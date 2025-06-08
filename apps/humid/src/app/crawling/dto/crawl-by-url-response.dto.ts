import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const crawlByUrlResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  chapterCount: z.string(),
  originId: z.string(),
  status: z.string(),
  thumbImage: z.string(),
  id: z.number(),
  updatedAt: z.string(),
  createdAt: z.string(),
});

export class CrawlComicByUrlResponseDto extends createZodDto(
  crawlByUrlResponseSchema
) {}
