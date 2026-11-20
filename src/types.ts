export type FileCategory =
  | 'archive'
  | 'audio'
  | 'document'
  | 'executable'
  | 'font'
  | 'image'
  | 'text'
  | 'video'
  | 'binary';

export type FileTypeId =
  | '7z'
  | 'ar'
  | 'apk'
  | 'avi'
  | 'avif'
  | 'batch'
  | 'bmp'
  | 'bzip2'
  | 'cab'
  | 'class'
  | 'chm'
  | 'crx'
  | 'css'
  | 'cpio'
  | 'cur'
  | 'dex'
  | 'deb'
  | 'doc'
  | 'docx'
  | 'dmg'
  | 'elf'
  | 'eml'
  | 'epub'
  | 'flac'
  | 'flv'
  | 'gif'
  | 'gzip'
  | 'heif'
  | 'html'
  | 'ico'
  | 'iso'
  | 'ipa'
  | 'jar'
  | 'jpeg'
  | 'javascript'
  | 'json'
  | 'lz4'
  | 'macho'
  | 'markdown'
  | 'midi'
  | 'mkv'
  | 'msg'
  | 'mp3'
  | 'mp4'
  | 'm4a'
  | 'mov'
  | 'mxf'
  | 'ole'
  | 'ogg'
  | 'otf'
  | 'odp'
  | 'ods'
  | 'odt'
  | 'pdf'
  | 'pe'
  | 'parquet'
  | 'psd'
  | 'python'
  | 'ppt'
  | 'pptx'
  | 'png'
  | 'rar'
  | 'riff'
  | 'rtf'
  | 'rpm'
  | 'shell'
  | 'sqlite'
  | 'svg'
  | 'swf'
  | 'tar'
  | 'text'
  | 'tnef'
  | 'tiff'
  | 'ttf'
  | 'toml'
  | 'typescript'
  | 'wasm'
  | 'wav'
  | 'webm'
  | 'webp'
  | 'woff'
  | 'woff2'
  | 'wim'
  | 'vsix'
  | 'xar'
  | 'xls'
  | 'xlsx'
  | 'xml'
  | 'xz'
  | 'yaml'
  | 'zip'
  | 'zstd';

export type DetectionSourceKind =
  | 'bom'
  | 'container'
  | 'fallback'
  | 'filename'
  | 'signature'
  | 'text';

export interface DetectionSignal {
  source: DetectionSourceKind;
  ruleId: string;
  offset: number | null;
  detail: string;
}

export type DiagnosticCode =
  | 'ambiguous-result'
  | 'container-refinement-skipped'
  | 'empty-input'
  | 'insufficient-data'
  | 'read-budget-exceeded'
  | 'truncated-signature';

export interface DetectionDiagnostic {
  code: DiagnosticCode;
  message: string;
}

export interface ContainerInfo {
  kind: 'ole' | 'riff' | 'zip';
  refinedType: FileTypeId | null;
  complete: boolean;
  entryCount: number | null;
}

export interface DetectionResult {
  type: FileTypeId | 'unknown';
  name: string | null;
  description: string | null;
  mimeType: string | null;
  extensions: readonly string[];
  encoding: string | null;
  category: FileCategory | 'unknown';
  isText: boolean | null;
  confidence: number;
  authoritative: boolean;
  sizeBytes: number;
  bytesExamined: number;
  signals: readonly DetectionSignal[];
  diagnostics: readonly DetectionDiagnostic[];
  container: ContainerInfo | null;
}

export interface DetectOptions {
  /** Optional file name used only as a low-priority hint for text-like input. */
  fileName?: string;
  /** Use the file name as a weak tie-breaker when content is inconclusive. */
  useFileNameHint?: boolean;
  /** Include explainability signals in the result. Defaults to true. */
  includeSignals?: boolean;
}

export interface DetectFileOptions extends DetectOptions {
  /** Maximum number of bytes read from a file. Defaults to 2 MiB. */
  maxReadBytes?: number;
  /** Initial file window. Defaults to 64 KiB. */
  headBytes?: number;
  /** Final file window. Defaults to 128 KiB. */
  tailBytes?: number;
}

export interface FileTypeParserOptions extends DetectFileOptions {}

export interface FileTypeErrorOptions {
  cause?: unknown;
}
