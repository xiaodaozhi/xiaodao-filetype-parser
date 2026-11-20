# xiaodao-filetype-parser

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/npm/l/xiaodao-filetype-parser)](LICENSE)

English | [简体中文](README.ZH.md)

`xiaodao-filetype-parser` identifies files from their content. It is a pure TypeScript ESM package for Node.js and has no runtime dependency on `libmagic`, native DLLs, external commands, or decompression tools.

The detector returns a structured result with a stable type identifier, MIME type, extensions, category, encoding, confidence, authority, explainability signals, and bounded-read diagnostics.

## Installation

```bash
npm install xiaodao-filetype-parser
```

Node.js 20 or later is required. The package is published as an ES module.

## Quick start

```typescript
import { detect, detectFile, getFormatByExtension } from 'xiaodao-filetype-parser';
import fs from 'node:fs/promises';

const buffer = await fs.readFile('report.pdf');
const fromBuffer = detect(buffer);

console.log(fromBuffer.type);       // 'pdf'
console.log(fromBuffer.mimeType);   // 'application/pdf'
console.log(fromBuffer.authoritative); // true

const fromPath = await detectFile('report.pdf');
console.log(fromPath.description);

const mapping = getFormatByExtension('.DOCX');
console.log(mapping?.type);             // 'docx'
console.log(mapping?.definition.mimeType); // application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

The file name can be supplied as a weak hint for text-like content. It never overrides an authoritative content signature:

```typescript
const result = detect(Buffer.from('const answer = 42;\n'), {
  fileName: 'answer.js',
});

console.log(result.type);       // 'text'
console.log(result.authoritative); // false
console.log(result.signals);     // explains the text and filename signals
```

## Result

```typescript
interface DetectionResult {
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
```

`confidence` is between `0` and `1`. Content signatures and validated container structures are authoritative. Text heuristics and file name hints are deliberately lower-confidence results.

Unknown input is a normal result:

```typescript
const result = detect(Buffer.from([0, 1, 2, 3]));

if (result.type === 'unknown') {
  console.log('No reliable type was found.');
}
```

Parsing does not throw for unknown file content. It throws `FileTypeError` for invalid arguments, failed file reads, permission errors, and invalid read options.

## Bounded file reads

`detectFile()` reads a bounded head and tail window instead of loading a large file into memory. ZIP central-directory ranges are loaded when they can be located safely within the read budget.

```typescript
const result = await detectFile('large-upload.bin', {
  headBytes: 64 * 1024,
  tailBytes: 128 * 1024,
  maxReadBytes: 2 * 1024 * 1024,
});

console.log(result.sizeBytes);
console.log(result.bytesExamined);
console.log(result.diagnostics);
```

If an outer type can be identified but a container cannot be fully refined, the result keeps the outer type and reports `container-refinement-skipped`.

## Supported formats

The first release covers common images, audio and video files, documents, text formats, archives, Office ZIP/OLE containers, fonts, and executable formats, including PNG, JPEG, GIF, WebP, BMP, TIFF, AVIF, HEIF, SVG, MP3, M4A, WAV, FLAC, OGG, MP4, MOV, WebM, AVI, PDF, RTF, XML, JSON, EML, JavaScript, TypeScript, Python, YAML, ZIP, DOCX, XLSX, PPTX, ODT, ODS, ODP, EPUB, JAR, APK, IPA, VSIX, OLE, DOC, XLS, PPT, GZIP, BZIP2, XZ, 7z, RAR, TAR, Debian, RPM, SQLite, ELF, PE, Mach-O, Java Class, DEX, WebAssembly, TTF, OTF, WOFF, and WOFF2.

Extension mappings are also available without reading a file. `getFormatByExtension()` accepts a case-insensitive extension with or without a leading dot and returns the canonical type and full format metadata.

ZIP and OLE inspection is structural only. The package does not extract archives, execute content, parse macros, render HTML, or inspect embedded objects.

## Development

```bash
npm ci
npm run build
npm test
npm run check
```

The implementation is organized around a common byte-source abstraction. Buffer input is available synchronously. File paths use positional reads with a bounded cache, so detectors can share signature and container logic without depending on the input medium.

## License

MIT
