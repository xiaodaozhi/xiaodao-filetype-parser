export interface ByteSource {
  readonly size: number;
  readonly bytesExamined: number;
  readonly readBudgetExceeded: boolean;

  /**
   * Returns an exact range when that range is available in the source.
   * A missing range is represented by an empty buffer.
   */
  read(offset: number, length: number): Buffer;
}

export interface ByteRange {
  readonly offset: number;
  readonly data: Buffer;
}

export class RangeSource implements ByteSource {
  public readonly size: number;
  public readonly bytesExamined: number;
  public readonly readBudgetExceeded: boolean;
  private readonly ranges: readonly ByteRange[];

  public constructor(size: number, ranges: readonly ByteRange[], readBudgetExceeded = false) {
    this.size = size;
    this.ranges = ranges;
    this.readBudgetExceeded = readBudgetExceeded;
    const sorted = [...ranges].sort((left, right) => left.offset - right.offset);
    let coveredUntil = 0;
    let covered = 0;
    for (const range of sorted) {
      const start = Math.max(0, range.offset);
      const end = Math.min(size, range.offset + range.data.length);
      if (end <= start) continue;
      if (start > coveredUntil) {
        covered += end - start;
        coveredUntil = end;
      } else if (end > coveredUntil) {
        covered += end - coveredUntil;
        coveredUntil = end;
      }
    }
    this.bytesExamined = covered;
  }

  public read(offset: number, length: number): Buffer {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0) {
      return Buffer.alloc(0);
    }
    if (length === 0) return Buffer.alloc(0);
    const end = offset + length;
    if (end > this.size || end < offset) return Buffer.alloc(0);

    const sorted = [...this.ranges].sort((left, right) => left.offset - right.offset);
    const chunks: Buffer[] = [];
    let cursor = offset;
    while (cursor < end) {
      const range = sorted.find(item => cursor >= item.offset && cursor < item.offset + item.data.length);
      if (!range) return Buffer.alloc(0);
      const chunkEnd = Math.min(end, range.offset + range.data.length);
      chunks.push(range.data.subarray(cursor - range.offset, chunkEnd - range.offset));
      cursor = chunkEnd;
    }
    return chunks.length === 1 ? chunks[0] : Buffer.concat(chunks);
  }
}
