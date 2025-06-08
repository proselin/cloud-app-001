import { ResponseBuffer } from '../models/response.model';
import { ConvertUtils } from './convert.utils';

export class TransformInputUtils {
  /**
   * Transforms a value (typically a string) to a number.
   * Intended to be used as a transform function of an input.
   * @param value Value to be transformed.
   * @param fallbackValue Value to use if the provided value can't be parsed as a number.
   *
   *  @usageNotes
   *  ```ts
   *  @Input({ transform: numberAttribute }) id!: number;
   *  ```
   *
   *  @return {string| null}
   *
   */
  static bufferSource(value: ResponseBuffer): string | null {
    try {
      return ConvertUtils.BufferToObjectUrl(value, 'image/jpg');
    } catch {
      return null;
    }
  }
}
