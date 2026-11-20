import { extname } from 'node:path';
import { EXTENSION_TO_TYPE, FORMAT_DEFINITIONS } from '../formats.js';
import { MAX_TEXT_SNIFF_BYTES } from '../constants.js';
import { makeCandidate, hasTextualContent, readHead, type Candidate, type Detector } from './detector.js';

function detectBom(data: Buffer): Candidate | null {
  if (data.subarray(0, 4).equals(Buffer.from([0xff, 0xfe, 0, 0]))) {
    return makeCandidate('text', 0.99, true, 'bom', 'utf32le-bom', 'UTF-32 little-endian BOM', 0, { encoding: 'utf-32le' });
  }
  if (data.subarray(0, 4).equals(Buffer.from([0, 0, 0xfe, 0xff]))) {
    return makeCandidate('text', 0.99, true, 'bom', 'utf32be-bom', 'UTF-32 big-endian BOM', 0, { encoding: 'utf-32be' });
  }
  if (data.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) {
    return makeCandidate('text', 0.99, true, 'bom', 'utf8-bom', 'UTF-8 BOM', 0, { encoding: 'utf-8' });
  }
  if (data.subarray(0, 2).equals(Buffer.from([0xff, 0xfe]))) {
    return makeCandidate('text', 0.99, true, 'bom', 'utf16le-bom', 'UTF-16 little-endian BOM', 0, { encoding: 'utf-16le' });
  }
  if (data.subarray(0, 2).equals(Buffer.from([0xfe, 0xff]))) {
    return makeCandidate('text', 0.99, true, 'bom', 'utf16be-bom', 'UTF-16 big-endian BOM', 0, { encoding: 'utf-16be' });
  }
  return null;
}

function detectBomlessWideText(data: Buffer): Candidate | null {
  if (data.length < 16) return null;
  const examined = data.length - (data.length % 4);
  const zeros = [0, 0, 0, 0];
  for (let index = 0; index < examined; index++) {
    if (data[index] === 0) zeros[index % 4]++;
  }
  const perPhase = examined / 4;
  const high = perPhase * 0.75;
  const low = perPhase * 0.25;
  if (zeros[1] > high && zeros[3] > high && zeros[0] < low && zeros[2] < low) {
    return makeCandidate('text', 0.6, false, 'text', 'utf16le-zero-pattern', 'Text has a UTF-16LE zero-byte pattern', null, { encoding: 'utf-16le' });
  }
  if (zeros[0] > high && zeros[2] > high && zeros[1] < low && zeros[3] < low) {
    return makeCandidate('text', 0.6, false, 'text', 'utf16be-zero-pattern', 'Text has a UTF-16BE zero-byte pattern', null, { encoding: 'utf-16be' });
  }
  return null;
}

function isUtf8(data: Buffer): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(data);
    return true;
  } catch {
    return false;
  }
}

function extensionHint(fileName: string | undefined): Candidate | null {
  if (!fileName) return null;
  const extension = extname(fileName).slice(1).toLowerCase();
  if (!extension) return null;
  const type = EXTENSION_TO_TYPE[extension];
  const definition = type ? FORMAT_DEFINITIONS[type] : undefined;
  if (!type || !definition?.isText) return null;
  return makeCandidate(type, 0.52, false, 'filename', `filename-${extension}`, `File name suggests a ${extension} text format`);
}

function textContentCandidate(data: Buffer, fileName: string | undefined): Candidate | null {
  const bom = detectBom(data);
  if (bom) return bom;
  const wide = detectBomlessWideText(data);
  if (wide) return wide;
  if (!hasTextualContent(data)) return null;

  const utf8 = isUtf8(data);
  const encoding = utf8 ? 'utf-8' : 'latin1';
  const text = data.toString(utf8 ? 'utf8' : 'latin1').replace(/^\uFEFF/, '').trim();
  const lower = text.toLowerCase();

  if (lower.startsWith('#!')) {
    if (/python(?:\d+(?:\.\d+)*)?\b/.test(lower)) return makeCandidate('python', 0.9, true, 'text', 'python-shebang', 'Text contains a Python shebang', 0, { encoding });
    if (/node(?:js)?\b|deno\b|bun\b/.test(lower)) return makeCandidate('javascript', 0.86, true, 'text', 'javascript-shebang', 'Text contains a JavaScript runtime shebang', 0, { encoding });
    return makeCandidate('shell', 0.82, true, 'text', 'shell-shebang', 'Text contains a shell shebang', 0, { encoding });
  }
  if (lower.startsWith('<?php') || lower.includes('wscript.') || lower.includes('createobject(')) {
    return makeCandidate('text', 0.8, false, 'text', 'script-marker', 'Text contains a recognizable script marker', null, { encoding });
  }
  if (text.startsWith('%!PS-Adobe-')) {
    return makeCandidate('postscript', 0.9, true, 'text', 'postscript-header', 'Text contains a PostScript header', 0, { encoding });
  }
  if (lower.startsWith('<svg') || lower.includes('<svg ')) {
    return makeCandidate('svg', 0.92, true, 'text', 'svg-structure', 'Text contains an SVG root element', null, { encoding });
  }
  if (lower.startsWith('<!doctype html') || lower.startsWith('<html') || lower.includes('<body')) {
    return makeCandidate('html', 0.9, true, 'text', 'html-structure', 'Text contains an HTML document marker', null, { encoding });
  }
  if (lower.startsWith('<?xml') || /^<\?xml\b|^<[-\w]+[\s>]/i.test(text)) {
    return makeCandidate('xml', 0.86, true, 'text', 'xml-structure', 'Text contains an XML document marker', null, { encoding });
  }
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'asset' in parsed) {
        return makeCandidate('gltf', 0.9, true, 'text', 'gltf-json', 'JSON contains a glTF asset object', null, { encoding });
      }
      return makeCandidate('json', 0.9, true, 'text', 'json-parse', 'Text parses as JSON', null, { encoding });
    } catch {
      // Continue to the lower-confidence plain-text result.
    }
  }
  const headerLines = text.split(/\r?\n/).slice(0, 64);
  const knownHeader = /^(from|to|subject|date|mime-version|content-type|message-id):\s/i;
  if (headerLines.some(line => knownHeader.test(line)) && (/\r?\n\r?\n/.test(text) || headerLines.length <= 4)) {
    return makeCandidate('eml', 0.84, true, 'text', 'rfc5322-header', 'Text contains RFC 5322/MIME headers', null, { encoding });
  }
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const delimiterCount = (line: string): number => line.split(',').length - 1;
    const csvDelimiterCount = delimiterCount(lines[0]);
    if (csvDelimiterCount > 0 && lines.every(line => delimiterCount(line) === csvDelimiterCount)) {
      return makeCandidate('csv', 0.78, false, 'text', 'csv-rows', 'Text has consistent comma-separated rows', null, { encoding });
    }
    if (/^\[[^\]\r\n]+\]$/.test(lines[0]) && lines.some(line => /^[^=\r\n]+\s*=/.test(line))) {
      return makeCandidate('ini', 0.78, false, 'text', 'ini-section', 'Text has an INI section and key-value entries', null, { encoding });
    }
  }
  const hint = extensionHint(fileName);
  if (hint) return { ...hint, encoding };
  return makeCandidate('text', 0.5, false, 'text', 'printable-text', 'Input is predominantly printable text', null, { encoding });
}

export const textDetector: Detector = ({ source, options }) => {
  const data = readHead(source, MAX_TEXT_SNIFF_BYTES);
  if (data.length === 0) return null;
  return textContentCandidate(data, options.useFileNameHint === false ? undefined : options.fileName);
};

export function filenameOnlyHint(fileName: string | undefined): Candidate | null {
  return extensionHint(fileName);
}
