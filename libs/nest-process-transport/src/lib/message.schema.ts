import { z } from 'zod';

export const PostProcessSchema = z.object({
  id: z.string().uuid("Id must be a string uuid"),
  pattern: z.string(),
  data: z.any(),
  isEvent: z.boolean().nullable()
});
