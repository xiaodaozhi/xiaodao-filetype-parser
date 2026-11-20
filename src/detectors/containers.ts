import {
  MAX_ZIP_DIRECTORY_BYTES,
  ZIP_CENTRAL_FILE_SIGNATURE,
  ZIP_END_SIGNATURE,
} from '../constants.js';
import type { ByteSource } from '../source/byte-source.js';
import type { ContainerInfo, DetectionDiagnostic } from '../types.js';
import { makeCandidate, type Candidate, type DetectionContext } from './detector.js';

interface ZipDirectory {
  offset: number;
  size: number;
}

interface ZipEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

function findEndOfCentralDirectory(source: ByteSource): ZipDirectory | null {
  const tailOffset = Math.max(0, source.size - 128 * 1024);
  const tail = source.read(tailOffset, source.size - tailOffset);
  if (tail.length < 22) return null;

  const searchStart = Math.max(0, tail.length - (22 + 0xffff));
  for (let index = tail.length - 22; index >= searchStart; index--) {
    if (tail.readUInt32LE(index) !== ZIP_END_SIGNATURE) continue;
    const disk = tail.readUInt16LE(index + 4);
    const directoryDisk = tail.readUInt16LE(index + 6);
    const entriesOnDisk = tail.readUInt16LE(index + 8);
    const entries = tail.readUInt16LE(index + 10);
    const size = tail.readUInt32LE(index + 12);
    const offset = tail.readUInt32LE(index + 16);
    if (disk !== 0 || directoryDisk !== 0 || entriesOnDisk !== entries) return null;
    if (size > MAX_ZIP_DIRECTORY_BYTES || offset + size > source.size) return null;
    return { offset, size };
  }
  return null;
}

function readZipEntries(directory: Buffer): ZipEntry[] | null {
  const entries: ZipEntry[] = [];
  let offset = 0;
  while (offset + 46 <= directory.length) {
    if (directory.readUInt32LE(offset) !== ZIP_CENTRAL_FILE_SIGNATURE) break;
    const compressionMethod = directory.readUInt16LE(offset + 10);
    const compressedSize = directory.readUInt32LE(offset + 20);
    const uncompressedSize = directory.readUInt32LE(offset + 24);
    const nameLength = directory.readUInt16LE(offset + 28);
    const extraLength = directory.readUInt16LE(offset + 30);
    const commentLength = directory.readUInt16LE(offset + 32);
    const end = offset + 46 + nameLength + extraLength + commentLength;
    if (end > directory.length) return null;
    const nameBytes = directory.subarray(offset + 46, offset + 46 + nameLength);
    entries.push({
      name: nameBytes.toString('utf8'),
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset: directory.readUInt32LE(offset + 42),
    });
    offset = end;
  }
  return entries.length === 0 || offset === directory.length || directory.readUInt32LE(offset) !== ZIP_CENTRAL_FILE_SIGNATURE
    ? entries
    : null;
}

function readStoredZipEntry(source: ByteSource, entry: ZipEntry): Buffer | null {
  if (entry.compressionMethod !== 0 || entry.compressedSize !== entry.uncompressedSize || entry.uncompressedSize > 4096) return null;
  const localHeader = source.read(entry.localHeaderOffset, 30);
  if (localHeader.length < 30 || localHeader.readUInt32LE(0) !== 0x04034b50) return null;
  const nameLength = localHeader.readUInt16LE(26);
  const extraLength = localHeader.readUInt16LE(28);
  const dataOffset = entry.localHeaderOffset + 30 + nameLength + extraLength;
  const data = source.read(dataOffset, entry.compressedSize);
  return data.length === entry.compressedSize ? data : null;
}

function zipRefinement(source: ByteSource, entries: readonly ZipEntry[]): { type: Candidate['type']; ruleId: string; detail: string } | null {
  const normalizedEntries = entries.map(entry => ({ ...entry, name: entry.name.replace(/\\/g, '/') }));
  const normalized = normalizedEntries.map(entry => entry.name);
  const set = new Set(normalized);
  const mimetypeEntry = normalizedEntries.find(entry => entry.name === 'mimetype');
  const mimetype = mimetypeEntry ? readStoredZipEntry(source, mimetypeEntry)?.toString('utf8').trim() : null;
  if (set.has('AndroidManifest.xml') || set.has('classes.dex')) return { type: 'apk', ruleId: 'zip-apk-entries', detail: 'ZIP entries identify an Android package' };
  if (set.has('[Content_Types].xml') && normalized.some(name => name === 'word/document.xml' || name.startsWith('word/'))) {
    return { type: 'docx', ruleId: 'zip-docx-entries', detail: 'ZIP entries identify an Office Open XML Word document' };
  }
  if (set.has('[Content_Types].xml') && normalized.some(name => name === 'xl/workbook.xml' || name.startsWith('xl/'))) {
    return { type: 'xlsx', ruleId: 'zip-xlsx-entries', detail: 'ZIP entries identify an Office Open XML spreadsheet' };
  }
  if (set.has('[Content_Types].xml') && normalized.some(name => name === 'ppt/presentation.xml' || name.startsWith('ppt/'))) {
    return { type: 'pptx', ruleId: 'zip-pptx-entries', detail: 'ZIP entries identify an Office Open XML presentation' };
  }
  if (set.has('mimetype') && normalized.some(name => name.startsWith('META-INF/')) && normalized.some(name => name.startsWith('OEBPS/') || name.startsWith('OPS/'))) {
    return { type: 'epub', ruleId: 'zip-epub-entries', detail: 'ZIP entries identify an EPUB book' };
  }
  if (set.has('META-INF/MANIFEST.MF') && normalized.some(name => name.endsWith('.class'))) {
    return { type: 'jar', ruleId: 'zip-jar-entries', detail: 'ZIP entries identify a Java archive' };
  }
  if (mimetype === 'application/vnd.oasis.opendocument.text') {
    return { type: 'odt', ruleId: 'zip-odt-mimetype', detail: 'The stored mimetype entry identifies an OpenDocument text file' };
  }
  if (mimetype === 'application/vnd.oasis.opendocument.spreadsheet') {
    return { type: 'ods', ruleId: 'zip-ods-mimetype', detail: 'The stored mimetype entry identifies an OpenDocument spreadsheet' };
  }
  if (mimetype === 'application/vnd.oasis.opendocument.presentation') {
    return { type: 'odp', ruleId: 'zip-odp-mimetype', detail: 'The stored mimetype entry identifies an OpenDocument presentation' };
  }
  if (normalized.some(name => name.startsWith('Payload/')) && normalized.some(name => name.endsWith('.app/Info.plist'))) {
    return { type: 'ipa', ruleId: 'zip-ipa-entries', detail: 'ZIP entries identify an iOS application package' };
  }
  if (set.has('extension.vsixmanifest') || normalized.some(name => name.endsWith('/extension.vsixmanifest'))) {
    return { type: 'vsix', ruleId: 'zip-vsix-entries', detail: 'ZIP entries identify a Visual Studio extension package' };
  }
  return null;
}

function zipContainer(source: ByteSource, base: Candidate): Candidate {
  const directory = findEndOfCentralDirectory(source);
  if (!directory) {
    const diagnostic: DetectionDiagnostic = {
      code: 'container-refinement-skipped',
      message: 'ZIP central directory was not available or is outside the safe inspection limit.',
    };
    return {
      ...base,
      container: { kind: 'zip', refinedType: null, complete: false, entryCount: null },
      diagnostics: [...(base.diagnostics ?? []), diagnostic],
    };
  }

  const directoryData = source.read(directory.offset, directory.size);
  const entries = readZipEntries(directoryData);
  if (!entries) {
    const diagnostic: DetectionDiagnostic = {
      code: 'container-refinement-skipped',
      message: 'ZIP central directory is truncated or malformed.',
    };
    return {
      ...base,
      container: { kind: 'zip', refinedType: null, complete: false, entryCount: null },
      diagnostics: [...(base.diagnostics ?? []), diagnostic],
    };
  }

  const refined = zipRefinement(source, entries);
  if (!refined) {
    return {
      ...base,
      container: { kind: 'zip', refinedType: null, complete: true, entryCount: entries.length },
    };
  }
  const refinedCandidate = makeCandidate(
    refined.type,
    0.99,
    true,
    'container',
    refined.ruleId,
    refined.detail,
    null,
    { container: { kind: 'zip', refinedType: refined.type, complete: true, entryCount: entries.length } },
  );
  return { ...refinedCandidate, signals: [base.signal, refinedCandidate.signal] };
}

function findAsciiOrUtf16(data: Buffer, text: string): boolean {
  const ascii = Buffer.from(text, 'ascii');
  if (data.includes(ascii)) return true;
  const utf16 = Buffer.from(`${text}\0`, 'utf16le');
  return data.includes(utf16);
}

function oleRefinement(source: ByteSource, base: Candidate): Candidate {
  const data = source.size <= 16 * 1024 * 1024 ? source.read(0, source.size) : Buffer.alloc(0);
  if (data.length !== source.size) {
    return {
      ...base,
      container: { kind: 'ole', refinedType: null, complete: false, entryCount: null },
      diagnostics: [...(base.diagnostics ?? []), {
        code: 'container-refinement-skipped',
        message: 'OLE directory refinement requires the complete container and was skipped for the bounded file source.',
      }],
    };
  }

  let refined: Candidate['type'] | null = null;
  let ruleId = '';
  let detail = '';
  if (findAsciiOrUtf16(data, '__properties_version1.0')) {
    refined = 'msg';
    ruleId = 'ole-msg-properties';
    detail = 'OLE streams identify an Outlook MSG property store';
  } else if (findAsciiOrUtf16(data, 'WordDocument')) {
    refined = 'doc';
    ruleId = 'ole-word-document';
    detail = 'OLE streams identify a Word document';
  } else if (findAsciiOrUtf16(data, 'Workbook') || findAsciiOrUtf16(data, 'Book')) {
    refined = 'xls';
    ruleId = 'ole-excel-workbook';
    detail = 'OLE streams identify an Excel workbook';
  } else if (findAsciiOrUtf16(data, 'PowerPoint Document')) {
    refined = 'ppt';
    ruleId = 'ole-powerpoint-document';
    detail = 'OLE streams identify a PowerPoint presentation';
  }

  if (!refined) {
    return {
      ...base,
      container: { kind: 'ole', refinedType: null, complete: true, entryCount: null },
    };
  }
  const refinedCandidate = makeCandidate(refined, 0.98, true, 'container', ruleId, detail, null, {
    container: { kind: 'ole', refinedType: refined, complete: true, entryCount: null },
  });
  return { ...refinedCandidate, signals: [base.signal, refinedCandidate.signal] };
}

export function refineContainer(context: DetectionContext, base: Candidate): Candidate {
  if (base.type === 'zip') return zipContainer(context.source, base);
  if (base.type === 'ole') return oleRefinement(context.source, base);
  if (base.type === 'riff') {
    return {
      ...base,
      container: { kind: 'riff', refinedType: null, complete: true, entryCount: null },
    };
  }
  return base;
}
