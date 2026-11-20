import type { ByteSource } from '../source/byte-source.js';
import type {
  ContainerInfo,
  DetectionDiagnostic,
  DetectionSignal,
  DetectionSourceKind,
  DetectOptions,
  FileTypeId,
} from '../types.js';

export interface Candidate {
  type: FileTypeId;
  confidence: number;
  authoritative: boolean;
  signal: DetectionSignal;
  signals?: readonly DetectionSignal[];
  encoding?: string;
  container?: ContainerInfo;
  diagnostics?: readonly DetectionDiagnostic[];
}

export interface DetectionContext {
  source: ByteSource;
  options: DetectOptions;
}

export type Detector = (context: DetectionContext) => Candidate | null;

export function makeCandidate(
  type: FileTypeId,
  confidence: number,
  authoritative: boolean,
  source: DetectionSourceKind,
  ruleId: string,
  detail: string,
  offset: number | null = null,
  extra: Pick<Candidate, 'container' | 'diagnostics' | 'encoding' | 'signals'> = {},
): Candidate {
  return {
    type,
    confidence,
    authoritative,
    signal: { source, ruleId, offset, detail },
    ...extra,
  };
}

export function hasBytes(data: Buffer, offset: number, expected: readonly number[]): boolean {
  if (offset < 0 || offset + expected.length > data.length) return false;
  return expected.every((value, index) => data[offset + index] === value);
}

export function hasAscii(data: Buffer, offset: number, text: string): boolean {
  return hasBytes(data, offset, [...Buffer.from(text, 'ascii')]);
}

export function readHead(source: ByteSource, maximum = 64 * 1024): Buffer {
  return source.read(0, Math.min(source.size, maximum));
}

export function hasTextualContent(data: Buffer): boolean {
  if (data.length === 0) return false;
  let control = 0;
  for (const byte of data) {
    if (byte === 0) return false;
    if (byte < 0x09 || (byte > 0x0d && byte < 0x20) || byte === 0x7f) control++;
  }
  return control * 100 <= data.length;
}
