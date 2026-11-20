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

The same component is also available from GitHub Packages under the scoped name `@xiaodaozhi/xiaodao-filetype-parser`:

```bash
npm install @xiaodaozhi/xiaodao-filetype-parser --registry=https://npm.pkg.github.com/
```

GitHub Packages requires authentication with a GitHub token that has `read:packages`. Use the scoped package name in imports when installing from this registry. [GitHub Releases](https://github.com/xiaodaozhi/xiaodao-filetype-parser/releases) provide both package archives and SHA-256 checksums for downloading directly.

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

The first release covers common images, audio and video files, documents, text formats, archives, Office ZIP/OLE containers, fonts, and executable formats, including PNG, JPEG, GIF, WebP, BMP, TIFF, JPEG 2000, AVIF, HEIF, SVG, MP3, AAC, M4A, MIDI, WAV, FLAC, OGG, MP4, MOV, 3GPP, MPEG, WebM, AVI, SWF, PDF, PostScript, RTF, XML, JSON, glTF, CSV, INI, EML, JavaScript, TypeScript, Python, YAML, ZIP, DOCX, XLSX, PPTX, ODT, ODS, ODP, EPUB, JAR, APK, IPA, VSIX, MOBI, OLE, DOC, XLS, PPT, binary plist, GZIP, BZIP2, XZ, 7z, RAR, TAR, Debian, RPM, SQLite, ELF, PE, Mach-O, Java Class, DEX, WebAssembly, TTF, OTF, WOFF, and WOFF2.

Extension mappings are also available without reading a file. `getFormatByExtension()` accepts a case-insensitive extension with or without a leading dot and returns the canonical type and full format metadata.

ZIP and OLE inspection is structural only. The package does not extract archives, execute content, parse macros, render HTML, or inspect embedded objects.

## Development

```bash
npm ci
npm run build
npm test
npm run check
npm run pack:check
```

The implementation is organized around a common byte-source abstraction. Buffer input is available synchronously. File paths use positional reads with a bounded cache, so detectors can share signature and container logic without depending on the input medium.

## Release

Create a Git tag whose version matches `package.json`, then push the tag:

```bash
git tag v0.1.1
git push origin v0.1.1
```

The publish workflow checks the tag version, installs from the lockfile, runs `npm run check`, verifies the package contents, and publishes to npm through GitHub OIDC and npm Trusted Publishing without a long-lived npm token.

Configure the package's Trusted Publisher in its npm settings before releasing:

| Setting | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `xiaodaozhi` |
| Repository | `xiaodao-filetype-parser` |
| Workflow filename | `publish.yml` |
| Environment | Leave empty |
| Permission | Allow `npm publish` |

The workflow filename is `publish.yml`, including the extension; `Publish` is only the workflow's display name. A connection marked **Pending validation** is validated by its first successful trusted publish. If publishing returns `E404` or `ENEEDAUTH`, verify the package exists and that these settings and the publish permission match. A `0.0.0-stage` placeholder does not mean a release has been published.

Use a new version for each release: npm does not allow an existing version to be overwritten. Update both `package.json` and `package-lock.json` before creating the matching tag. Provenance is generated automatically when npm's public-repository eligibility requirements are met. See [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers) for the initial package setup and provider requirements.

The separate **GitHub Packages and Release** workflow also runs on version tags. It checks out the tag, validates the version, builds and tests the component, and publishes `@xiaodaozhi/xiaodao-filetype-parser` using the workflow's `GITHUB_TOKEN` with `packages: write`. After publishing succeeds, it creates the corresponding GitHub Release with generated notes, the unscoped and scoped `.tgz` archives, and `SHA256SUMS`. Prerelease versions produce prereleases.

To publish an existing tag to GitHub Packages and create its Release without republishing to npmjs.org, run this workflow from `main` with the `tag` input:

```bash
gh workflow run github-packages.yml --ref main -f tag=v0.1.1
```

Rerunning verifies the integrity of an existing GitHub Packages version before updating Release assets; it refuses to overwrite a package with different contents. The repository's Actions settings must allow package creation. No additional package token is required in repository secrets.

## License

MIT
