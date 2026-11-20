import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'));
const tagPrefix = 'refs/tags/v';
const ref = process.env.GITHUB_REF ?? '';

if (!ref.startsWith(tagPrefix)) {
  console.error(`Release must run from a version tag matching refs/tags/v${packageJson.version}; received ${ref || '<empty ref>'}.`);
  process.exit(1);
}

const tagVersion = ref.slice(tagPrefix.length);
if (tagVersion !== packageJson.version) {
  console.error(`Release tag v${tagVersion} does not match package.json version ${packageJson.version}.`);
  process.exit(1);
}

console.log(`Release tag v${tagVersion} matches ${packageJson.name}@${packageJson.version}.`);
