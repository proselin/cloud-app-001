import { z } from 'zod';

export const PostProcessSchema = z.object({
  id: z.string(),
  pattern: z.string(), // Pattern to match handlers
  data: z.object({}), // Data payload
});
