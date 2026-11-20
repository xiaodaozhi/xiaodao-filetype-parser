import path from 'node:path';
import { DEFAULT_HEAD_BYTES, DEFAULT_MAX_READ_BYTES, DEFAULT_TAIL_BYTES } from './constants.js';
import { FileTypeError } from './errors.js';
import { FORMAT_DEFINITIONS } from './formats.js';
import { identify } from './detectors/registry.js';
import { BufferSource } from './source/buffer-source.js';
import { prepareFileSource } from './source/file-source.js';
import type { ByteSource } from './source/byte-source.js';
import type {
  DetectFileOptions,
  DetectionDiagnostic,
  DetectionResult,
  DetectionSignal,
  DetectOptions,
  FileTypeParserOptions,
} from './types.js';

function normalizeInput(input: Buffer | Uint8Array): Buffer {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input);
  throw new FileTypeError('invalid-input', 'Input must be a Buffer or Uint8Array.');
}

function mergeOptions(base: FileTypeParserOptions, override: DetectOptions | DetectFileOptions = {}): DetectFileOptions {
  return {
    fileName: override.fileName ?? base.fileName,
    useFileNameHint: override.useFileNameHint ?? base.useFileNameHint ?? true,
    includeSignals: override.includeSignals ?? base.includeSignals ?? true,
    maxReadBytes: 'maxReadBytes' in override ? override.maxReadBytes : base.maxReadBytes ?? DEFAULT_MAX_READ_BYTES,
    headBytes: 'headBytes' in override ? override.headBytes : base.headBytes ?? DEFAULT_HEAD_BYTES,
    tailBytes: 'tailBytes' in override ? override.tailBytes : base.tailBytes ?? DEFAULT_TAIL_BYTES,
  };
}

function buildUnknownResult(sourceSize: number, bytesExamined: number, diagnostics: readonly DetectionDiagnostic[], includeSignals: boolean): DetectionResult {
  return {
    type: 'unknown',
    name: null,
    description: null,
    mimeType: null,
    extensions: [],
    encoding: null,
    category: 'unknown',
    isText: null,
    confidence: 0,
    authoritative: false,
    sizeBytes: sourceSize,
    bytesExamined,
    signals: includeSignals ? [] : [],
    diagnostics,
    container: null,
  };
}

export default class FileTypeParser {
  private readonly defaults: FileTypeParserOptions;

  public constructor(options: FileTypeParserOptions = {}) {
    this.defaults = { ...options };
  }

  public detect(input: Buffer | Uint8Array, options: DetectOptions = {}): DetectionResult {
    const buffer = normalizeInput(input);
    const merged = mergeOptions(this.defaults, options);
    const source = new BufferSource(buffer);
    return this.detectSource(source, merged);
  }

  public async detectFile(filePath: string, options: DetectFileOptions = {}): Promise<DetectionResult> {
    const merged = mergeOptions(this.defaults, options);
    const prepared = await prepareFileSource(filePath, merged);
    const effective = {
      ...merged,
      fileName: merged.fileName ?? path.basename(filePath),
    };
    return this.detectSource(prepared.source, effective);
  }

  public static detect(input: Buffer | Uint8Array, options: DetectOptions = {}): DetectionResult {
    return new FileTypeParser().detect(input, options);
  }

  public static detectFile(filePath: string, options: DetectFileOptions = {}): Promise<DetectionResult> {
    return new FileTypeParser().detectFile(filePath, options);
  }

  private detectSource(source: ByteSource, options: DetectFileOptions): DetectionResult {
    const diagnostics: DetectionDiagnostic[] = [];
    if (source.size === 0) {
      diagnostics.push({ code: 'empty-input', message: 'Input is empty.' });
    }
    if (source.readBudgetExceeded) {
      diagnostics.push({ code: 'read-budget-exceeded', message: 'The configured file read budget prevented some inspection ranges from being loaded.' });
    }

    const candidate = source.size === 0 ? null : identify(source, options);
    if (!candidate) {
      if (source.size > 0 && source.bytesExamined < source.size) {
        diagnostics.push({ code: 'insufficient-data', message: 'The available inspection windows were insufficient to identify the file.' });
      }
      return buildUnknownResult(source.size, source.bytesExamined, diagnostics, options.includeSignals !== false);
    }

    const definition = FORMAT_DEFINITIONS[candidate.type];
    const allDiagnostics = [...diagnostics, ...(candidate.diagnostics ?? [])];
    const signals: DetectionSignal[] = [...(candidate.signals ?? [candidate.signal])];
    return {
      type: candidate.type,
      name: definition.name,
      description: definition.description,
      mimeType: definition.mimeType,
      extensions: definition.extensions,
      encoding: candidate.encoding ?? definition.encoding,
      category: definition.category,
      isText: definition.isText,
      confidence: Math.max(0, Math.min(1, candidate.confidence)),
      authoritative: candidate.authoritative,
      sizeBytes: source.size,
      bytesExamined: source.bytesExamined,
      signals: options.includeSignals === false ? [] : signals,
      diagnostics: allDiagnostics,
      container: candidate.container ?? null,
    };
  }
}

export function detect(input: Buffer | Uint8Array, options: DetectOptions = {}): DetectionResult {
  return new FileTypeParser().detect(input, options);
}

export function detectFile(filePath: string, options: DetectFileOptions = {}): Promise<DetectionResult> {
  return new FileTypeParser().detectFile(filePath, options);
}
