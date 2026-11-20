import type { ByteSource } from '../source/byte-source.js';
import type { DetectOptions } from '../types.js';
import { refineContainer } from './containers.js';
import { type Candidate, type DetectionContext } from './detector.js';
import { signatureDetector } from './signatures.js';
import { textDetector } from './text.js';

export function identify(source: ByteSource, options: DetectOptions): Candidate | null {
  const context: DetectionContext = { source, options };
  const signature = signatureDetector(context);
  if (signature) {
    return refineContainer(context, signature);
  }
  return textDetector(context);
}
