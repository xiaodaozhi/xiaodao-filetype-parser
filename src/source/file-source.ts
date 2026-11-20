import fs from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import {
  DEFAULT_HEAD_BYTES,
  DEFAULT_MAX_READ_BYTES,
  DEFAULT_TAIL_BYTES,
  MAX_ZIP_DIRECTORY_BYTES,
  ZIP_END_SIGNATURE,
} from '../constants.js';
import { FileTypeError } from '../errors.js';
import type { DetectFileOptions } from '../types.js';
import { RangeSource, type ByteRange } from './byte-source.js';

export interface PreparedFileSource {
  source: RangeSource;
  size: number;
}

interface ValidatedOptions {
  headBytes: number;
  tailBytes: number;
  maxReadBytes: number;
}

function positiveInteger(value: number | undefined, fallback: number, label: string): number {
  const resolved = value ?? fallback;
  if (!Number.isSafeInteger(resolved) || resolved <= 0) {
    throw new FileTypeError('invalid-options', `${label} must be a positive safe integer.`);
  }
  return resolved;
}

function validateOptions(options: DetectFileOptions): ValidatedOptions {
  return {
    headBytes: positiveInteger(options.headBytes, DEFAULT_HEAD_BYTES, 'headBytes'),
    tailBytes: positiveInteger(options.tailBytes, DEFAULT_TAIL_BYTES, 'tailBytes'),
    maxReadBytes: positiveInteger(options.maxReadBytes, DEFAULT_MAX_READ_BYTES, 'maxReadBytes'),
  };
}

function isCovered(ranges: readonly ByteRange[], offset: number, length: number): boolean {
  return ranges.some(range => offset >= range.offset && offset + length <= range.offset + range.data.length);
}

function findZipDirectory(tail: Buffer): { offset: number; size: number } | null {
  const minimum = 22;
  const searchStart = Math.max(0, tail.length - (minimum + 0xffff));
  for (let index = tail.length - minimum; index >= searchStart; index--) {
    if (tail.readUInt32LE(index) !== ZIP_END_SIGNATURE) continue;
    const directorySize = tail.readUInt32LE(index + 12);
    const directoryOffset = tail.readUInt32LE(index + 16);
    if (directorySize > MAX_ZIP_DIRECTORY_BYTES) return null;
    return { offset: directoryOffset, size: directorySize };
  }
  return null;
}

/**
 * Opens a path and materializes only the bounded ranges needed by detection.
 * The returned source is detached from the file handle, so the handle can be
 * closed before parsing begins.
 */
export async function prepareFileSource(filePath: string, options: DetectFileOptions = {}): Promise<PreparedFileSource> {
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new FileTypeError('invalid-input', 'filePath must be a non-empty string.');
  }
  const validated = validateOptions(options);
  let handle: FileHandle;
  try {
    handle = await fs.open(filePath, 'r');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    throw new FileTypeError(
      code === 'EACCES' || code === 'EPERM' ? 'permission-denied' : 'read-failed',
      `Could not open file: ${filePath}`,
      { cause: error },
    );
  }

  try {
    const stat = await handle.stat();
    if (!stat.isFile()) {
      throw new FileTypeError('read-failed', `Path is not a regular file: ${filePath}`);
    }
    if (!Number.isSafeInteger(stat.size)) {
      throw new FileTypeError('read-failed', `File size is outside the supported range: ${filePath}`);
    }

    const ranges: ByteRange[] = [];
    let bytesRead = 0;
    let readBudgetExceeded = false;

    const load = async (offset: number, requestedLength: number): Promise<Buffer> => {
      if (requestedLength <= 0 || offset >= stat.size || isCovered(ranges, offset, requestedLength)) {
        return Buffer.alloc(0);
      }
      const length = Math.min(requestedLength, stat.size - offset);
      if (length <= 0) return Buffer.alloc(0);
      const remaining = validated.maxReadBytes - bytesRead;
      if (remaining <= 0 || length > remaining) {
        readBudgetExceeded = true;
        return Buffer.alloc(0);
      }
      const buffer = Buffer.allocUnsafe(length);
      try {
        const result = await handle.read(buffer, 0, length, offset);
        const actual = buffer.subarray(0, result.bytesRead);
        ranges.push({ offset, data: actual });
        bytesRead += actual.length;
        return actual;
      } catch (error) {
        throw new FileTypeError('read-failed', `Could not read file: ${filePath}`, { cause: error });
      }
    };

    const headLength = Math.min(validated.headBytes, stat.size);
    await load(0, headLength);

    const tailOffset = Math.max(0, stat.size - validated.tailBytes);
    const tailLength = stat.size - tailOffset;
    await load(tailOffset, tailLength);

    const tail = new RangeSource(stat.size, ranges).read(tailOffset, tailLength);
    const directory = tail.length > 0 ? findZipDirectory(tail) : null;
    if (directory && directory.offset + directory.size <= stat.size && directory.size > 0) {
      await load(directory.offset, directory.size);
    }

    return {
      source: new RangeSource(stat.size, ranges, readBudgetExceeded),
      size: stat.size,
    };
  } finally {
    await handle.close();
  }
}
