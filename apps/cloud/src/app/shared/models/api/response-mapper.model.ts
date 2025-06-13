/**
 * Generic response wrapper for all API responses
 */
export interface ResponseMapper<T = unknown> {
  data: T;
  message?: string;
  statusCode?: number;
}
