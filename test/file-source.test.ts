import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { detectFile } from '../index.js';

describe('bounded file source', () => {
  it('detects a large file from bounded windows', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'xiaodao-filetype-'));
    const filePath = path.join(directory, 'picture.bin');
    try {
      const data = Buffer.alloc(1024 * 1024, 0x41);
      data[0] = 0x89;
      data[1] = 0x50;
      data[2] = 0x4e;
      data[3] = 0x47;
      data[4] = 0x0d;
      data[5] = 0x0a;
      data[6] = 0x1a;
      data[7] = 0x0a;
      await fs.writeFile(filePath, data);

      const result = await detectFile(filePath);
      assert.equal(result.type, 'png');
      assert.equal(result.sizeBytes, data.length);
      assert.ok(result.bytesExamined < data.length);
      assert.equal(result.signals[0]?.source, 'signature');
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it('reports a read-budget diagnostic when the configured budget is too small', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'xiaodao-filetype-budget-'));
    const filePath = path.join(directory, 'unknown.bin');
    try {
      await fs.writeFile(filePath, Buffer.alloc(4096, 0x41));
      const result = await detectFile(filePath, { maxReadBytes: 8 });
      assert.equal(result.type, 'unknown');
      assert.ok(result.diagnostics.some(item => item.code === 'read-budget-exceeded'));
    } finally {
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
});
