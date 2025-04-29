import { z } from 'zod';

export const PostProcessSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  data: z.any(),
});
