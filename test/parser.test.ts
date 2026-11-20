import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import FileTypeParser, { detect } from '../index.js';

describe('file type parser', () => {
  it('detects common binary signatures and exposes structured metadata', () => {
    const result = detect(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), {
      fileName: 'wrong.txt',
    });

    assert.equal(result.type, 'png');
    assert.equal(result.mimeType, 'image/png');
    assert.equal(result.category, 'image');
    assert.equal(result.authoritative, true);
    assert.equal(result.signals[0]?.source, 'signature');
  });

  it('distinguishes Java class and Mach-O universal headers', () => {
    assert.equal(detect(Buffer.from([0xca, 0xfe, 0xba, 0xbe, 0, 0, 0, 52])).type, 'class');

    const fatMachO = Buffer.alloc(8 + 20);
    fatMachO.writeUInt32BE(0xcaFEBAbe, 0);
    fatMachO.writeUInt32BE(1, 4);
    assert.equal(detect(fatMachO).type, 'macho');
  });

  it('detects text, JSON, XML, MIME, and BOM encodings', () => {
    assert.equal(detect(Buffer.from('{"ok":true}')).type, 'json');
    assert.equal(detect(Buffer.from('<?xml version="1.0"?><root/>')).type, 'xml');
    assert.equal(detect(Buffer.from('From: sender@example.com\r\nSubject: Test\r\n\r\nBody')).type, 'eml');

    const utf16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('hello', 'utf16le')]);
    const result = detect(utf16);
    assert.equal(result.type, 'text');
    assert.equal(result.encoding, 'utf-16le');
    assert.equal(result.authoritative, true);
  });

  it('requires a Parquet footer for an authoritative Parquet result', () => {
    const complete = detect(Buffer.from('PAR1metadataPAR1'));
    assert.equal(complete.type, 'parquet');
    assert.equal(complete.authoritative, true);
    assert.equal(complete.signals[0]?.ruleId, 'parquet-header-footer');

    const headerOnly = detect(Buffer.from('PAR1metadata'));
    assert.equal(headerOnly.type, 'parquet');
    assert.equal(headerOnly.authoritative, false);
    assert.equal(headerOnly.signals[0]?.ruleId, 'parquet-header');
  });

  it('uses the file name only as a weak text hint', () => {
    const result = detect(Buffer.from('const answer = 42;\n'), { fileName: 'answer.js' });
    assert.equal(result.type, 'javascript');
    assert.equal(result.authoritative, false);
    assert.equal(result.signals[0]?.source, 'filename');

    const binary = detect(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), { fileName: 'answer.txt' });
    assert.equal(binary.type, 'png');

    const withoutHint = detect(Buffer.from('plain words'), {
      fileName: 'data.json',
      useFileNameHint: false,
    });
    assert.equal(withoutHint.type, 'text');
  });

  it('returns unknown for unrecognized input instead of throwing', () => {
    const result = detect(Buffer.from([0, 1, 2, 3, 0xff, 0xfe, 0x10]));
    assert.equal(result.type, 'unknown');
    assert.equal(result.mimeType, null);
    assert.equal(result.confidence, 0);
    assert.equal(result.authoritative, false);
  });

  it('does not throw for every truncated prefix of a signature', () => {
    const fixture = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    for (let length = 0; length <= fixture.length; length++) {
      assert.doesNotThrow(() => detect(fixture.subarray(0, length)));
    }
  });

  it('supports parser defaults and disabling explainability signals', () => {
    const parser = new FileTypeParser({ includeSignals: false });
    const result = parser.detect(Buffer.from('%PDF-1.7'));
    assert.equal(result.type, 'pdf');
    assert.deepEqual(result.signals, []);
  });
});
