import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { detect, detectFile } from '../index.js';

const fixtureDirectory = path.join(process.cwd(), 'test', 'fixtures', 'real');

const samples = [
  ['sample.3gp', '3gp', 'video/3gpp', true],
  ['sample.aac', 'aac', 'audio/aac', true],
  ['sample.bmp', 'bmp', 'image/bmp', true],
  ['sample.cur', 'cur', 'image/x-win-bitmap', true],
  ['sample.flac', 'flac', 'audio/flac', true],
  ['one-pixel.png', 'png', 'image/png', true],
  ['one-pixel.gif', 'gif', 'image/gif', true],
  ['one-pixel.jpg', 'jpeg', 'image/jpeg', true],
  ['sample.ico', 'ico', 'image/x-icon', true],
  ['sample.jp2', 'jp2', 'image/jp2', true],
  ['sample.mid', 'midi', 'audio/midi', true],
  ['sample.mp3', 'mp3', 'audio/mpeg', true],
  ['sample.mp4', 'mp4', 'video/mp4', true],
  ['sample.odt', 'odt', 'application/vnd.oasis.opendocument.text', true],
  ['sample.ods', 'ods', 'application/vnd.oasis.opendocument.spreadsheet', true],
  ['sample.odp', 'odp', 'application/vnd.oasis.opendocument.presentation', true],
  ['sample.parquet', 'parquet', 'application/vnd.apache.parquet', true],
  ['sample.pdf', 'pdf', 'application/pdf', true],
  ['sample.csv', 'csv', 'text/csv', false],
  ['sample.gltf', 'gltf', 'model/gltf+json', true],
  ['sample.glb', 'glb', 'model/gltf-binary', true],
  ['sample.ini', 'ini', 'text/plain', false],
  ['sample.mobi', 'mobi', 'application/x-mobipocket-ebook', true],
  ['sample.mpeg', 'mpeg', 'video/mpeg', true],
  ['sample.plist', 'plist', 'application/x-plist', true],
  ['sample.ps', 'postscript', 'application/postscript', true],
  ['sample.swf', 'swf', 'application/x-shockwave-flash', true],
  ['sample.wav', 'wav', 'audio/wav', true],
  ['sample.gz', 'gzip', 'application/gzip', true],
  ['sample.tar', 'tar', 'application/x-tar', true],
  ['sample.svg', 'svg', 'image/svg+xml', true],
  ['sample.tiff', 'tiff', 'image/tiff', true],
  ['sample.eml', 'eml', 'message/rfc822', true],
  ['sample.sqlite', 'sqlite', 'application/vnd.sqlite3', true],
  ['sample.wasm', 'wasm', 'application/wasm', true],
  ['sample.docx', 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', true],
  ['sample.xlsx', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true],
  ['sample.pptx', 'pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', true],
  ['sample.jar', 'jar', 'application/java-archive', true],
  ['sample.epub', 'epub', 'application/epub+zip', true],
  ['sample.ipa', 'ipa', 'application/octet-stream', true],
  ['sample.vsix', 'vsix', 'application/vsix', true],
  ['sample.webm', 'webm', 'video/webm', true],
  ['sample.webp', 'webp', 'image/webp', true],
] as const;

describe('real format fixtures', () => {
  it('recognizes fixture files from their contents', async () => {
    for (const [fileName, expectedType, expectedMime, expectedAuthoritative] of samples) {
      const filePath = path.join(fixtureDirectory, fileName);
      const result = detect(await fs.readFile(filePath), { fileName: 'unknown.bin' });
      assert.equal(result.type, expectedType, fileName);
      assert.equal(result.mimeType, expectedMime, fileName);
      assert.equal(result.authoritative, expectedAuthoritative, fileName);
    }
  });

  it('recognizes the same fixtures through the bounded file API', async () => {
    for (const [fileName, expectedType] of samples) {
      const result = await detectFile(path.join(fixtureDirectory, fileName));
      assert.equal(result.type, expectedType, fileName);
      assert.ok(result.bytesExamined > 0, fileName);
    }
  });
});
