import { z } from 'zod';
import { PostProcessSchema } from '../validate/schemas';

export type ProcessMessage<T = any> = z.infer<typeof PostProcessSchema> & {
  data: T;
};

export interface ProcessResponse<T = any> {
  id: string; // ID of the original message
  response?: T; // Response data
  err?: any; // Error if one occurred
}
