import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FORMAT_DEFINITIONS, EXTENSION_TO_TYPE, getFormatByExtension } from '../src/formats.js';

describe('format metadata', () => {
  it('keeps every public format mapped to a MIME type and extension', () => {
    for (const [type, definition] of Object.entries(FORMAT_DEFINITIONS)) {
      assert.ok(definition.mimeType.length > 0, type);
      assert.ok(definition.extensions.length > 0, type);
      for (const extension of definition.extensions) {
        assert.equal(extension, extension.toLowerCase(), `${type}.${extension}`);
        assert.equal(EXTENSION_TO_TYPE[extension], type, `${type}.${extension}`);
      }
    }
  });

  it('resolves aliases, dotted extensions, and case differences', () => {
    assert.equal(getFormatByExtension('.DOCX')?.type, 'docx');
    assert.equal(getFormatByExtension('JpEg')?.definition.mimeType, 'image/jpeg');
    assert.equal(getFormatByExtension('m4a')?.type, 'm4a');
    assert.equal(getFormatByExtension('unknown-extension'), null);
  });
});
