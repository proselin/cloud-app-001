import { z } from 'zod'; 

export const PostProcessSchema = z.object({
  id: z.string().uuid("Id must be a string uuid"),
  pattern: z.string(), // Pattern to match handlers
  data: z.object({}), // Data payload
  isEvent: z.boolean().nullable() // Whether this is an event (no response expected)
})
