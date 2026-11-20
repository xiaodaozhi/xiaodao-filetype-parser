import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { detect, detectFile } from '../index.js';

const fixtureDirectory = path.join(process.cwd(), 'test', 'fixtures', 'real');

const samples = [
  ['one-pixel.png', 'png', 'image/png'],
  ['one-pixel.gif', 'gif', 'image/gif'],
  ['one-pixel.jpg', 'jpeg', 'image/jpeg'],
  ['sample.pdf', 'pdf', 'application/pdf'],
  ['sample.wav', 'wav', 'audio/wav'],
  ['sample.gz', 'gzip', 'application/gzip'],
  ['sample.tar', 'tar', 'application/x-tar'],
  ['sample.svg', 'svg', 'image/svg+xml'],
  ['sample.eml', 'eml', 'message/rfc822'],
  ['sample.sqlite', 'sqlite', 'application/vnd.sqlite3'],
  ['sample.wasm', 'wasm', 'application/wasm'],
  ['sample.docx', 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['sample.xlsx', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ['sample.pptx', 'pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ['sample.jar', 'jar', 'application/java-archive'],
  ['sample.epub', 'epub', 'application/epub+zip'],
  ['sample.ipa', 'ipa', 'application/octet-stream'],
  ['sample.vsix', 'vsix', 'application/vsix'],
] as const;

describe('real format fixtures', () => {
  it('recognizes complete fixture files from their contents', async () => {
    for (const [fileName, expectedType, expectedMime] of samples) {
      const filePath = path.join(fixtureDirectory, fileName);
      const result = detect(await fs.readFile(filePath), { fileName: 'unknown.bin' });
      assert.equal(result.type, expectedType, fileName);
      assert.equal(result.mimeType, expectedMime, fileName);
      assert.equal(result.authoritative, true, fileName);
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
