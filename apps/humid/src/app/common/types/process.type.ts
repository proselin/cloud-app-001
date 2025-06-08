import { z } from 'zod';
import { PostProcessSchema } from '../validate/schemas';

export type ProcessMessage<T = unknown> = z.infer<typeof PostProcessSchema> & {
  data: T;
};

export interface ProcessResponse<T = unknown> {
  id: string; // ID of the original message
  response?: T; // Response data
  err?: unknown; // Error if one occurred
}
