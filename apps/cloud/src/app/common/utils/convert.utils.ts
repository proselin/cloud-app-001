import { ResponseBuffer } from '../models/response.model';

export class ConvertUtils {
  /**
   * Converts a buffer containing binary data into a Blob with a specified MIME type.
   *
   * @param buffer - The buffer object containing binary data. Should be structured as:
   *   {
   *     type: "Buffer",
   *     data: Array<number>
   *   }
   * @param mimeType - The MIME type for the data, e.g., 'image/png', 'image/jpeg'.
   * @returns {Blob} A Blob object containing the binary data
   *
   * @throws {Error} If the buffer is not in the expected format.
   */
  static BufferToBlob(buffer: ResponseBuffer, mimeType: string): Blob {
    if (!('type' in buffer) || buffer.type != 'Buffer') {
      throw new Error(
        `Invalid Buffer:  Buffer Type is not correct. receive ${buffer.type}`
      );
    }

    if (!('data' in buffer) || !Array.isArray(buffer.data)) {
      throw new Error(
        `Invalid Buffer: Buffer data is should be an array. Receive ${buffer.data}`
      );
    }

    //Convert data array to Uint8Array
    const byteArray = new Uint8Array(buffer.data);
    //Create a Blob (specify correct MIME type, e.g., 'image/png')
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Converts a buffer containing binary data into an Object URL that can be used as a source for HTML elements.
   *
   * @param buffer - The buffer object containing binary data. Should be structured as:
   *   {
   *     type: "Buffer",
   *     data: Array<number>
   *   }
   * @param mimeType - The MIME type for the data, e.g., 'image/png', 'image/jpeg'.
   * @returns {string} An Object URL representing the Blob
   *
   * @throws {Error} If the buffer is not in the expected format.
   */
  static BufferToObjectUrl(buffer: ResponseBuffer, mimeType: string): string {
    return (webkitURL || URL).createObjectURL(
      ConvertUtils.BufferToBlob(buffer, mimeType)
    );
  }
}
