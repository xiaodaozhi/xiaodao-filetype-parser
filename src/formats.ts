import type { FileCategory, FileTypeId } from './types.js';

export interface FormatDefinition {
  name: string;
  description: string;
  mimeType: string;
  extensions: readonly string[];
  category: FileCategory;
  encoding: string;
  isText: boolean;
}

export interface FormatLookup {
  type: FileTypeId;
  definition: FormatDefinition;
}

const binary = (name: string, description: string, mimeType: string, extensions: readonly string[], category: FileCategory): FormatDefinition => ({
  name,
  description,
  mimeType,
  extensions,
  category,
  encoding: 'binary',
  isText: false,
});

export const FORMAT_DEFINITIONS: Record<FileTypeId, FormatDefinition> = {
  '7z': binary('7-Zip archive', '7-Zip compressed archive', 'application/x-7z-compressed', ['7z'], 'archive'),
  ar: binary('AR archive', 'Unix ar archive', 'application/x-archive', ['ar'], 'archive'),
  apk: binary('APK package', 'Android application package', 'application/vnd.android.package-archive', ['apk'], 'archive'),
  avi: binary('AVI video', 'Audio Video Interleave video', 'video/x-msvideo', ['avi'], 'video'),
  avif: binary('AVIF image', 'AV1 Image File Format image', 'image/avif', ['avif'], 'image'),
  batch: { name: 'Batch script', description: 'Windows command shell script', mimeType: 'text/x-msdos-batch', extensions: ['bat', 'cmd'], category: 'text', encoding: 'utf-8', isText: true },
  bmp: binary('BMP image', 'Bitmap image', 'image/bmp', ['bmp'], 'image'),
  bzip2: binary('BZIP2 archive', 'BZIP2 compressed data', 'application/x-bzip2', ['bz2', 'boz'], 'archive'),
  cab: binary('CAB archive', 'Microsoft Cabinet archive', 'application/vnd.ms-cab-compressed', ['cab'], 'archive'),
  class: binary('Java class', 'Java class file', 'application/java-vm', ['class'], 'executable'),
  chm: binary('CHM help file', 'Compiled HTML Help file', 'application/vnd.ms-htmlhelp', ['chm'], 'document'),
  crx: binary('CRX extension', 'Chrome extension package', 'application/x-chrome-extension', ['crx'], 'archive'),
  css: { name: 'CSS stylesheet', description: 'Cascading Style Sheets document', mimeType: 'text/css', extensions: ['css'], category: 'text', encoding: 'utf-8', isText: true },
  cpio: binary('CPIO archive', 'CPIO archive', 'application/x-cpio', ['cpio'], 'archive'),
  cur: binary('CUR image', 'Windows cursor image', 'image/x-win-bitmap', ['cur'], 'image'),
  deb: binary('Debian package', 'Debian binary package', 'application/vnd.debian.binary-package', ['deb'], 'archive'),
  dex: binary('DEX executable', 'Dalvik executable', 'application/vnd.android.dex', ['dex'], 'executable'),
  doc: binary('DOC document', 'Microsoft Word binary document', 'application/msword', ['doc'], 'document'),
  docx: binary('DOCX document', 'Office Open XML Word document', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ['docx'], 'document'),
  dmg: binary('DMG image', 'Apple disk image', 'application/x-apple-diskimage', ['dmg'], 'archive'),
  elf: binary('ELF executable', 'Executable and Linkable Format binary', 'application/x-elf', ['elf', 'so'], 'executable'),
  eml: { name: 'EML message', description: 'RFC 5322/MIME email message', mimeType: 'message/rfc822', extensions: ['eml', 'mime'], category: 'document', encoding: 'utf-8', isText: true },
  epub: binary('EPUB book', '電子出版物 EPUB archive', 'application/epub+zip', ['epub'], 'document'),
  flac: binary('FLAC audio', 'Free Lossless Audio Codec audio', 'audio/flac', ['flac'], 'audio'),
  flv: binary('FLV video', 'Flash video', 'video/x-flv', ['flv'], 'video'),
  gif: binary('GIF image', 'Graphics Interchange Format image', 'image/gif', ['gif'], 'image'),
  gzip: binary('GZIP archive', 'GZIP compressed data', 'application/gzip', ['gz'], 'archive'),
  heif: binary('HEIF image', 'High Efficiency Image File Format image', 'image/heif', ['heic', 'heif'], 'image'),
  html: { name: 'HTML document', description: 'HyperText Markup Language document', mimeType: 'text/html', extensions: ['html', 'htm'], category: 'text', encoding: 'utf-8', isText: true },
  ico: binary('ICO image', 'Windows icon image', 'image/x-icon', ['ico'], 'image'),
  iso: binary('ISO image', 'ISO 9660 disk image', 'application/x-iso9660-image', ['iso'], 'archive'),
  ipa: binary('IPA package', 'iOS application package', 'application/octet-stream', ['ipa'], 'archive'),
  jar: binary('JAR archive', 'Java archive', 'application/java-archive', ['jar'], 'archive'),
  jpeg: binary('JPEG image', 'JPEG image', 'image/jpeg', ['jpg', 'jpeg', 'jpe'], 'image'),
  javascript: { name: 'JavaScript source', description: 'JavaScript source code', mimeType: 'text/javascript', extensions: ['js', 'mjs', 'cjs', 'jsx'], category: 'text', encoding: 'utf-8', isText: true },
  json: { name: 'JSON document', description: 'JavaScript Object Notation document', mimeType: 'application/json', extensions: ['json', 'map'], category: 'text', encoding: 'utf-8', isText: true },
  lz4: binary('LZ4 archive', 'LZ4 compressed data', 'application/x-lz4', ['lz4'], 'archive'),
  macho: binary('Mach-O executable', 'Mach-O executable binary', 'application/x-mach-binary', ['macho', 'dylib'], 'executable'),
  m4a: binary('M4A audio', 'MPEG-4 audio container', 'audio/mp4', ['m4a'], 'audio'),
  markdown: { name: 'Markdown document', description: 'Markdown text document', mimeType: 'text/markdown', extensions: ['md', 'markdown'], category: 'text', encoding: 'utf-8', isText: true },
  midi: binary('MIDI audio', 'Musical Instrument Digital Interface sequence', 'audio/midi', ['mid', 'midi'], 'audio'),
  mkv: binary('Matroska video', 'Matroska multimedia container', 'video/x-matroska', ['mkv'], 'video'),
  msg: binary('MSG message', 'Outlook Compound File email message', 'application/vnd.ms-outlook', ['msg'], 'document'),
  mp3: binary('MP3 audio', 'MPEG Layer III audio', 'audio/mpeg', ['mp3'], 'audio'),
  mp4: binary('MP4 video', 'MPEG-4 media container', 'video/mp4', ['mp4', 'm4v'], 'video'),
  mov: binary('MOV video', 'QuickTime media container', 'video/quicktime', ['mov', 'qt'], 'video'),
  mxf: binary('MXF video', 'Material Exchange Format container', 'application/mxf', ['mxf'], 'video'),
  ole: binary('OLE container', 'Microsoft Compound File Binary container', 'application/x-ole-storage', ['ole', 'cfb'], 'document'),
  ogg: binary('OGG container', 'Ogg multimedia container', 'application/ogg', ['ogg', 'oga', 'ogv', 'ogx', 'opus'], 'audio'),
  otf: binary('OpenType font', 'OpenType font', 'font/otf', ['otf'], 'font'),
  odp: binary('ODP presentation', 'OpenDocument presentation', 'application/vnd.oasis.opendocument.presentation', ['odp'], 'document'),
  ods: binary('ODS spreadsheet', 'OpenDocument spreadsheet', 'application/vnd.oasis.opendocument.spreadsheet', ['ods'], 'document'),
  odt: binary('ODT document', 'OpenDocument text document', 'application/vnd.oasis.opendocument.text', ['odt'], 'document'),
  parquet: binary('Parquet file', 'Apache Parquet columnar data file', 'application/vnd.apache.parquet', ['parquet'], 'binary'),
  pdf: binary('PDF document', 'Portable Document Format document', 'application/pdf', ['pdf'], 'document'),
  pe: binary('PE executable', 'Portable Executable binary', 'application/vnd.microsoft.portable-executable', ['exe', 'dll', 'sys'], 'executable'),
  psd: binary('PSD image', 'Adobe Photoshop document', 'image/vnd.adobe.photoshop', ['psd'], 'image'),
  python: { name: 'Python source', description: 'Python source code', mimeType: 'text/x-python', extensions: ['py', 'pyw'], category: 'text', encoding: 'utf-8', isText: true },
  ppt: binary('PPT presentation', 'Microsoft PowerPoint binary presentation', 'application/vnd.ms-powerpoint', ['ppt'], 'document'),
  pptx: binary('PPTX presentation', 'Office Open XML PowerPoint presentation', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ['pptx'], 'document'),
  png: binary('PNG image', 'Portable Network Graphics image', 'image/png', ['png'], 'image'),
  rar: binary('RAR archive', 'RAR compressed archive', 'application/vnd.rar', ['rar'], 'archive'),
  riff: binary('RIFF container', 'Resource Interchange File Format container', 'application/octet-stream', ['riff'], 'binary'),
  rtf: { name: 'RTF document', description: 'Rich Text Format document', mimeType: 'application/rtf', extensions: ['rtf'], category: 'document', encoding: 'utf-8', isText: true },
  rpm: binary('RPM package', 'RPM package', 'application/x-rpm', ['rpm'], 'archive'),
  shell: { name: 'Shell script', description: 'Unix shell script', mimeType: 'text/x-shellscript', extensions: ['sh', 'bash', 'zsh'], category: 'text', encoding: 'utf-8', isText: true },
  sqlite: binary('SQLite database', 'SQLite 3 database', 'application/vnd.sqlite3', ['db', 'sqlite', 'sqlite3'], 'binary'),
  svg: { name: 'SVG image', description: 'Scalable Vector Graphics image', mimeType: 'image/svg+xml', extensions: ['svg'], category: 'image', encoding: 'utf-8', isText: true },
  swf: binary('SWF movie', 'Shockwave Flash movie', 'application/x-shockwave-flash', ['swf'], 'video'),
  tar: binary('TAR archive', 'Tape archive', 'application/x-tar', ['tar'], 'archive'),
  text: { name: 'Plain text', description: 'Plain text document', mimeType: 'text/plain', extensions: ['txt', 'text', 'log'], category: 'text', encoding: 'utf-8', isText: true },
  tnef: binary('TNEF attachment', 'Transport Neutral Encapsulation Format attachment', 'application/vnd.ms-tnef', ['tnef', 'dat'], 'document'),
  tiff: binary('TIFF image', 'Tagged Image File Format image', 'image/tiff', ['tif', 'tiff'], 'image'),
  toml: { name: 'TOML document', description: 'TOML configuration document', mimeType: 'application/toml', extensions: ['toml'], category: 'text', encoding: 'utf-8', isText: true },
  ttf: binary('TrueType font', 'TrueType font', 'font/ttf', ['ttf'], 'font'),
  typescript: { name: 'TypeScript source', description: 'TypeScript source code', mimeType: 'text/typescript', extensions: ['ts', 'tsx'], category: 'text', encoding: 'utf-8', isText: true },
  wasm: binary('WebAssembly module', 'WebAssembly binary module', 'application/wasm', ['wasm'], 'executable'),
  wav: binary('WAV audio', 'Waveform Audio File Format audio', 'audio/wav', ['wav'], 'audio'),
  webm: binary('WebM video', 'WebM multimedia container', 'video/webm', ['webm'], 'video'),
  webp: binary('WebP image', 'WebP image', 'image/webp', ['webp'], 'image'),
  woff: binary('WOFF font', 'Web Open Font Format font', 'font/woff', ['woff'], 'font'),
  woff2: binary('WOFF2 font', 'Web Open Font Format 2 font', 'font/woff2', ['woff2'], 'font'),
  wim: binary('WIM image', 'Windows Imaging Format image', 'application/x-ms-wim', ['wim'], 'archive'),
  vsix: binary('VSIX extension', 'Visual Studio extension package', 'application/vsix', ['vsix'], 'archive'),
  xar: binary('XAR archive', 'Extensible ARchive', 'application/x-xar', ['xar'], 'archive'),
  xls: binary('XLS spreadsheet', 'Microsoft Excel binary spreadsheet', 'application/vnd.ms-excel', ['xls'], 'document'),
  xlsx: binary('XLSX spreadsheet', 'Office Open XML Excel spreadsheet', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ['xlsx'], 'document'),
  xml: { name: 'XML document', description: 'Extensible Markup Language document', mimeType: 'application/xml', extensions: ['xml'], category: 'text', encoding: 'utf-8', isText: true },
  xz: binary('XZ archive', 'XZ compressed data', 'application/x-xz', ['xz'], 'archive'),
  yaml: { name: 'YAML document', description: 'YAML data document', mimeType: 'application/yaml', extensions: ['yaml', 'yml'], category: 'text', encoding: 'utf-8', isText: true },
  zip: binary('ZIP archive', 'ZIP compressed archive', 'application/zip', ['zip'], 'archive'),
  zstd: binary('Zstandard archive', 'Zstandard compressed data', 'application/zstd', ['zst'], 'archive'),
};

export const EXTENSION_TO_TYPE: Readonly<Record<string, FileTypeId>> = Object.freeze(
  Object.fromEntries(
    Object.entries(FORMAT_DEFINITIONS).flatMap(([type, definition]) =>
      definition.extensions.map(extension => [extension, type as FileTypeId]),
    ),
  ),
);

export function getFormatByExtension(extension: string): FormatLookup | null {
  if (typeof extension !== 'string') return null;
  const normalized = extension.trim().replace(/^\./, '').toLowerCase();
  if (!normalized) return null;
  const type = EXTENSION_TO_TYPE[normalized];
  return type ? { type, definition: FORMAT_DEFINITIONS[type] } : null;
}
