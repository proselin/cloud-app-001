import { ProcessMessage } from '../types';

export function validateProcessMessageData(
  data: ProcessMessage<unknown>
): boolean {
  // TODO: Implement validation logic for process message data
  // This function should validate the structure and content of process messages
  return data !== null && data !== undefined;
}
