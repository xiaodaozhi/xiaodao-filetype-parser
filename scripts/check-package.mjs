import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'));
const npmCommand = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'npm';
const npmArguments = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'npm.cmd pack --dry-run --json --loglevel=error']
  : ['pack', '--dry-run', '--json', '--loglevel=error'];
const result = spawnSync(npmCommand, npmArguments, {
  cwd: repositoryRoot,
  encoding: 'utf8',
  shell: false,
});

if (result.error) throw result.error;
if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch (error) {
  throw new Error(`npm pack returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

const packageReport = Array.isArray(report) ? report[0] : report[packageJson.name] ?? report;
const files = Array.isArray(packageReport?.files) ? packageReport.files.map(file => file.path) : [];
const allowed = file => file === 'LICENSE'
  || file === 'README.md'
  || file === 'README.ZH.md'
  || file === 'package.json'
  || file.startsWith('dist/');
const unexpected = files.filter(file => !allowed(file));
const required = ['LICENSE', 'README.md', 'README.ZH.md', 'package.json', 'dist/index.js', 'dist/index.d.ts'];
const missing = required.filter(file => !files.includes(file));

if (packageReport?.name !== packageJson.name || packageReport?.version !== packageJson.version) {
  throw new Error(`Packed metadata does not match package.json: ${packageReport?.name}@${packageReport?.version}`);
}
if (unexpected.length > 0) throw new Error(`Unexpected files in npm package: ${unexpected.join(', ')}`);
if (missing.length > 0) throw new Error(`Required files are missing from npm package: ${missing.join(', ')}`);

console.log(`npm package ${packageJson.name}@${packageJson.version} contains ${files.length} expected files.`);
