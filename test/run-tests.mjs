import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import path from 'node:path';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const testFiles = (await readdir(testDirectory, { withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name.endsWith('.test.ts'))
  .map(entry => path.join(testDirectory, entry.name))
  .sort();

const child = spawn(process.execPath, ['--import', 'tsx', '--test', ...testFiles], {
  stdio: 'inherit',
  shell: false,
});

child.once('error', error => {
  console.error(error);
  process.exitCode = 1;
});

child.once('exit', (code, signal) => {
  if (signal) {
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});
