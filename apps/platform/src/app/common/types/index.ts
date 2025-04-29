export interface ProcessMessage<T> {
  id: string; // Unique ID for the message
  pattern: string; // Pattern to match handlers
  data: T; // Data payload
}

export interface ProcessResponse<T> {
  id: string; // ID of the original message
  response?: T; // Response data
  err?: any; // Error if one occurred
}
