/**
 * Generic response wrapper for all API responses
 */
export interface ResponseMapper<T = unknown> {
  data: T;
  message?: string;
  statusCode?: number;
}

// Base entity structure from backend
export interface CommonEntityPlainObject {
  id: number;
  createdAt: string;
  updatedAt: string;
}



// Image structure from backend
export interface ImagePlainObject extends CommonEntityPlainObject {
  fileName: string;
  originUrls: string;
  position: number;
  type: number;
}
