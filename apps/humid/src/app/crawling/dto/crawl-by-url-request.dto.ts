import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const crawlByUrlRequestSchema = z.object({
  url: z.string().url().describe('URL of the comic to crawl'),
});

export class CrawlByUrlRequestDto extends createZodDto(
  crawlByUrlRequestSchema
) {}
