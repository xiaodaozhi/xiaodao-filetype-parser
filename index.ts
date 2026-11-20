import FileTypeParser, { detect, detectFile } from './src/parser.js';

export { FileTypeError } from './src/errors.js';
export { getFormatByExtension } from './src/formats.js';
export { FileTypeParser };
export { default } from './src/parser.js';

export { detect, detectFile };

export type {
  ContainerInfo,
  DetectFileOptions,
  DetectionDiagnostic,
  DetectionResult,
  DetectionSignal,
  DetectOptions,
  FileCategory,
  FileTypeErrorOptions,
  FileTypeId,
  FileTypeParserOptions,
} from './src/types.js';
export type { FileTypeErrorCode } from './src/errors.js';
export type { FormatDefinition, FormatLookup } from './src/formats.js';
