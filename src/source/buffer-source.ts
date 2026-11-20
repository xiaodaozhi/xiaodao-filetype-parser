import type { ByteSource } from './byte-source.js';

export class BufferSource implements ByteSource {
  public readonly size: number;
  public readonly bytesExamined: number;
  public readonly readBudgetExceeded = false;
  private readonly buffer: Buffer;

  public constructor(input: Buffer) {
    this.buffer = input;
    this.size = input.length;
    this.bytesExamined = input.length;
  }

  public read(offset: number, length: number): Buffer {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0) {
      return Buffer.alloc(0);
    }
    if (offset > this.size || offset + length > this.size) return Buffer.alloc(0);
    return this.buffer.subarray(offset, offset + length);
  }
}
