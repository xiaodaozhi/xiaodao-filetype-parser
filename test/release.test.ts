import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const script = path.join(process.cwd(), 'scripts', 'verify-release-tag.mjs');
const { version } = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

function runWithRef(ref: string) {
  return spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_REF: ref },
  });
}

describe('release validation', () => {
  it('accepts a tag that matches package.json', () => {
    const result = runWithRef(`refs/tags/v${version}`);
    assert.equal(result.status, 0, result.stderr);
  });

  it('rejects branch refs and mismatched versions', () => {
    assert.notEqual(runWithRef('refs/heads/main').status, 0);
    assert.notEqual(runWithRef(`refs/tags/v${version}-mismatch`).status, 0);
  });
});
