# Format Support

English | [简体中文](zh-CN/format-support.md)

## Metadata contract

Every public `FileTypeId` has one entry in `FORMAT_DEFINITIONS` in `src/formats.ts`:

```ts
interface FormatDefinition {
  name: string;
  description: string;
  mimeType: string;
  extensions: readonly string[];
  category: FileCategory;
  encoding: string;
  isText: boolean;
}
```

The definition is the single metadata source used to build `DetectionResult` and the extension lookup table. Binary definitions use `encoding: 'binary'` and `isText: false`; text definitions declare their default text encoding and `isText: true`.

`EXTENSION_TO_TYPE` is derived from the definitions at module load time. Extensions are stored without a leading dot and in lowercase. `getFormatByExtension` trims whitespace, removes one leading dot, lowercases the value, and returns the matching type and definition. It returns `null` for an empty or unknown extension.

```ts
getFormatByExtension('.DOCX')?.type; // 'docx'
getFormatByExtension('  JpEg ')?.definition.mimeType; // 'image/jpeg'
getFormatByExtension('unknown'); // null
```

The lookup supports aliases such as `jpg`/`jpeg`, `htm`/`html`, `yml`/`yaml`, `3g2`/`3gp`, `m4v`/`mp4`, and `azw3`/`mobi`. An alias maps to one canonical `FileTypeId`; it does not create a second public format.

## Current coverage

The current definitions cover these groups:

| Group | Representative type IDs | Examples of MIME families |
| --- | --- | --- |
| Images | `png`, `jpeg`, `gif`, `bmp`, `tiff`, `ico`, `cur`, `jp2`, `webp`, `avif`, `heif`, `psd` | `image/*` |
| Audio | `mp3`, `aac`, `flac`, `midi`, `ogg`, `m4a`, `wav` | `audio/*` and `application/ogg` |
| Video and media containers | `mp4`, `mov`, `mpeg`, `3gp`, `avi`, `mkv`, `webm`, `flv`, `mxf`, `swf`, `riff` | `video/*`, `application/mxf`, and generic container MIME |
| Documents | `pdf`, `rtf`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`, `odt`, `ods`, `odp`, `epub`, `mobi`, `chm`, `msg` | Office, document, ebook, and message MIME types |
| Text and source | `text`, `markdown`, `json`, `xml`, `html`, `svg`, `csv`, `ini`, `yaml`, `toml`, `css`, `javascript`, `typescript`, `python`, `shell`, `batch`, `postscript`, `eml`, `gltf` | `text/*`, structured application types, and model MIME types |
| ZIP-based packages | `zip`, `jar`, `apk`, `ipa`, `vsix`, `odt`, `ods`, `odp`, `docx`, `xlsx`, `pptx`, `epub` | ZIP, Java, Android, Office Open XML, OpenDocument, and package MIME types |
| Archives and disk images | `7z`, `rar`, `gzip`, `bzip2`, `xz`, `zstd`, `lz4`, `tar`, `cpio`, `ar`, `cab`, `rpm`, `deb`, `dmg`, `iso`, `wim`, `xar` | `application/*` archive and image types |
| Executables and binary data | `pe`, `elf`, `macho`, `class`, `dex`, `wasm`, `sqlite`, `parquet`, `ole`, `plist`, `tnef` | Executable, database, document container, and binary data MIME types |
| Fonts | `ttf`, `otf`, `woff`, `woff2` | `font/*` |

The detector can return a generic container when the container signature is reliable but its subtype is unavailable. For example, a ZIP with no recognized package entries remains `zip`, and an unknown RIFF subtype remains `riff`.

## Where recognition rules belong

Use the narrowest detector that matches the evidence:

| File | Put rules here when they use |
| --- | --- |
| `src/detectors/signatures.ts` | Fixed bytes, magic numbers, byte-order markers, or small binary header fields. |
| `src/detectors/text.ts` | BOMs, encoding patterns, printable text, shebangs, text structure, or a bounded parse such as JSON. |
| `src/detectors/containers.ts` | ZIP entry names, stored ZIP metadata, OLE stream names, or RIFF subtypes. |

The rule should return a candidate with an explainable signal. Keep the candidate type in `FileTypeId`; keep names, MIME types, extensions, category, and default encoding in `FORMAT_DEFINITIONS`.

## Adding or changing a format

When adding a format:

1. Define the public ID and category in `src/types.ts`.
2. Add one metadata entry with a standards-based MIME type and the extensions the package intentionally supports.
3. Add a detector rule with a stable `ruleId`, useful `detail`, and a confidence that reflects the evidence.
4. Decide whether the rule is authoritative. A unique magic number is usually authoritative; a text heuristic or header-only check may not be.
5. Add at least one genuine fixture under `test/fixtures/real/`, using the real bytes of the format.
6. Add assertions to `test/real-samples.test.ts` and, when relevant, `test/formats.test.ts`.
7. Check aliases, case normalization, MIME metadata, packed contents, and both buffer and file detection.

Changing an existing MIME or extension is a public contract change. Update the README or release notes when consumers may observe a changed `DetectionResult`, and keep the mapping tests aligned with the intended canonical ID.

## Fixture policy

Fixtures should contain real file structures, headers, and representative metadata. A file that only has its extension changed does not test content identification. Small samples are preferred when they preserve the relevant structure, and fixture provenance should be recorded in `test/fixtures/real/README.md` when it is useful for future maintenance.

Tests should pass an unrelated filename to `detect` when proving content recognition. For bounded file tests, assert the same type through `detectFile` and verify that the inspection remains within the expected read model.
