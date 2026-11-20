import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detect } from '../index.js';

function makeZip(names: readonly string[]): Buffer {
  const local = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const centralParts: Buffer[] = [];
  for (const name of names) {
    const nameBuffer = Buffer.from(name, 'utf8');
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0x800, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt32LE(0, 20);
    header.writeUInt32LE(0, 24);
    header.writeUInt32LE(0, 28);
    header.writeUInt16LE(nameBuffer.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt32LE(0, 42);
    centralParts.push(Buffer.concat([header, nameBuffer]));
  }
  const central = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(names.length, 8);
  end.writeUInt16LE(names.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(local.length, 16);
  return Buffer.concat([local, central, end]);
}

describe('container refinement', () => {
  it('refines ZIP containers using central-directory entries', () => {
    const result = detect(makeZip(['[Content_Types].xml', 'word/document.xml']));
    assert.equal(result.type, 'docx');
    assert.deepEqual(result.container, {
      kind: 'zip',
      refinedType: 'docx',
      complete: true,
      entryCount: 2,
    });
    assert.ok(result.signals.some(signal => signal.source === 'container'));
  });

  it('keeps incomplete ZIP data as ZIP with a diagnostic', () => {
    const result = detect(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    assert.equal(result.type, 'zip');
    assert.equal(result.container?.complete, false);
    assert.ok(result.diagnostics.some(item => item.code === 'container-refinement-skipped'));
  });

  it('refines synthetic OLE stream names for common Office formats', () => {
    const cfb = Buffer.concat([
      Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      Buffer.alloc(64),
      Buffer.from('WordDocument', 'ascii'),
    ]);
    const result = detect(cfb);
    assert.equal(result.type, 'doc');
    assert.equal(result.container?.kind, 'ole');
  });
});
