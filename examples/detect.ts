import { detect, detectFile } from '../index.js';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node --import tsx examples/detect.ts path/to/file');
  process.exitCode = 1;
} else {
  const result = await detectFile(filePath);
  console.log(JSON.stringify(result, null, 2));

  const sample = Buffer.from('%PDF-1.7');
  console.log(detect(sample, { fileName: 'sample.bin' }));
}
