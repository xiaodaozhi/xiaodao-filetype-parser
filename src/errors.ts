import type { FileTypeErrorOptions } from './types.js';

export type FileTypeErrorCode =
  | 'invalid-input'
  | 'invalid-options'
  | 'permission-denied'
  | 'read-failed';

export class FileTypeError extends Error {
  public readonly code: FileTypeErrorCode;

  public constructor(code: FileTypeErrorCode, message: string, options: FileTypeErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'FileTypeError';
    this.code = code;
  }
}
