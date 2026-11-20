import { makeCandidate, hasAscii, hasBytes, readHead, type Candidate, type Detector } from './detector.js';

const CFB_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] as const;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

function u32le(data: Buffer, offset: number): number | null {
  return offset >= 0 && offset + 4 <= data.length ? data.readUInt32LE(offset) : null;
}

function u32be(data: Buffer, offset: number): number | null {
  return offset >= 0 && offset + 4 <= data.length ? data.readUInt32BE(offset) : null;
}

function detectRiff(data: Buffer): Candidate | null {
  if (!hasAscii(data, 0, 'RIFF') || data.length < 12) return null;
  const subtype = data.subarray(8, 12).toString('ascii');
  if (subtype === 'WAVE') return makeCandidate('wav', 0.99, true, 'signature', 'riff-wave', 'RIFF container with WAVE subtype');
  if (subtype === 'AVI ') return makeCandidate('avi', 0.99, true, 'signature', 'riff-avi', 'RIFF container with AVI subtype');
  if (subtype === 'WEBP') return makeCandidate('webp', 0.99, true, 'signature', 'riff-webp', 'RIFF container with WEBP subtype');
  return makeCandidate('riff', 0.92, true, 'signature', 'riff', 'RIFF container');
}

function detectIso(data: Buffer, sourceSize: number): Candidate | null {
  if (sourceSize < 32774) return null;
  const descriptor = data.length >= 32774 && hasAscii(data, 32769, 'CD001');
  return descriptor
    ? makeCandidate('iso', 0.99, true, 'signature', 'iso9660-primary-volume-descriptor', 'ISO 9660 primary volume descriptor', 32769)
    : null;
}

export const signatureDetector: Detector = ({ source }) => {
  const data = readHead(source);
  if (data.length === 0) return null;

  if (hasBytes(data, 0, PNG_SIGNATURE)) return makeCandidate('png', 0.99, true, 'signature', 'png-signature', 'PNG signature');
  if (hasBytes(data, 0, [0xff, 0xd8, 0xff])) return makeCandidate('jpeg', 0.99, true, 'signature', 'jpeg-signature', 'JPEG start-of-image marker');
  if (hasAscii(data, 0, 'GIF87a') || hasAscii(data, 0, 'GIF89a')) return makeCandidate('gif', 0.99, true, 'signature', 'gif-signature', 'GIF header');
  if (hasAscii(data, 0, 'RIFF')) return detectRiff(data);
  if (hasBytes(data, 0, [0x1a, 0x45, 0xdf, 0xa3])) {
    return data.includes(Buffer.from('webm', 'ascii'))
      ? makeCandidate('webm', 0.96, true, 'signature', 'webm-ebml', 'EBML container with WebM marker')
      : makeCandidate('mkv', 0.9, true, 'signature', 'matroska-ebml', 'EBML container');
  }
  if (hasAscii(data, 0, 'BM')) return makeCandidate('bmp', 0.98, true, 'signature', 'bmp-signature', 'BMP header');
  if (hasAscii(data, 0, 'II*\0') || hasAscii(data, 0, 'MM\0*')) return makeCandidate('tiff', 0.99, true, 'signature', 'tiff-signature', 'TIFF byte-order marker and version');
  if (hasBytes(data, 0, [0, 0, 1, 0])) return makeCandidate('ico', 0.98, true, 'signature', 'ico-signature', 'ICO header');
  if (hasBytes(data, 0, [0, 0, 2, 0])) return makeCandidate('cur', 0.98, true, 'signature', 'cur-signature', 'CUR header');
  if (hasAscii(data, 0, 'fLaC')) return makeCandidate('flac', 0.99, true, 'signature', 'flac-signature', 'FLAC marker');
  if (hasAscii(data, 0, 'OggS')) return makeCandidate('ogg', 0.98, true, 'signature', 'ogg-signature', 'Ogg page marker');
  if (hasAscii(data, 0, 'MThd')) return makeCandidate('midi', 0.99, true, 'signature', 'midi-signature', 'MIDI header');
  if (data.length >= 2 && data[0] === 0xff && (data[1] & 0xf6) === 0xf0) return makeCandidate('aac', 0.9, true, 'signature', 'aac-adts', 'AAC ADTS frame header');
  if (hasAscii(data, 0, 'ID3') || hasBytes(data, 0, [0xff, 0xfb]) || hasBytes(data, 0, [0xff, 0xf3]) || hasBytes(data, 0, [0xff, 0xf2])) {
    return makeCandidate('mp3', 0.94, true, 'signature', 'mp3-signature', 'MP3 ID3 tag or frame sync');
  }
  if (hasAscii(data, 0, 'FLV')) return makeCandidate('flv', 0.99, true, 'signature', 'flv-signature', 'FLV header');
  if (hasAscii(data, 0, 'FWS') || hasAscii(data, 0, 'CWS') || hasAscii(data, 0, 'ZWS')) {
    return makeCandidate('swf', 0.98, true, 'signature', 'swf-signature', 'Shockwave Flash header');
  }
  if (hasBytes(data, 0, [0x06, 0x0e, 0x2b, 0x34, 0x02, 0x05, 0x01, 0x01, 0x0d, 0x01, 0x02, 0x01, 0x01, 0x02])) {
    return makeCandidate('mxf', 0.98, true, 'signature', 'mxf-klv-header', 'MXF KLV header');
  }
  if (hasBytes(data, 0, [0x1f, 0x8b])) return makeCandidate('gzip', 0.99, true, 'signature', 'gzip-signature', 'GZIP header');
  if (hasAscii(data, 0, 'BZh')) return makeCandidate('bzip2', 0.98, true, 'signature', 'bzip2-signature', 'BZIP2 header');
  if (hasBytes(data, 0, [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00])) return makeCandidate('xz', 0.99, true, 'signature', 'xz-signature', 'XZ header');
  if (hasBytes(data, 0, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return makeCandidate('7z', 0.99, true, 'signature', '7z-signature', '7-Zip header');
  if (hasAscii(data, 0, 'Rar!\x1a\x07')) return makeCandidate('rar', 0.99, true, 'signature', 'rar-signature', 'RAR header');
  if (hasBytes(data, 0, [0x28, 0xb5, 0x2f, 0xfd])) return makeCandidate('zstd', 0.99, true, 'signature', 'zstd-signature', 'Zstandard frame header');
  if (hasBytes(data, 0, [0x04, 0x22, 0x4d, 0x18])) return makeCandidate('lz4', 0.99, true, 'signature', 'lz4-signature', 'LZ4 frame header');
  if (hasAscii(data, 0, 'MSCF')) return makeCandidate('cab', 0.99, true, 'signature', 'cab-signature', 'Microsoft Cabinet header');
  if (hasAscii(data, 0, 'ITSF')) return makeCandidate('chm', 0.98, true, 'signature', 'chm-signature', 'Compiled HTML Help header');
  if (hasAscii(data, 0, 'MSWIM\0\0\0')) return makeCandidate('wim', 0.98, true, 'signature', 'wim-signature', 'Windows Imaging Format header');
  if (hasAscii(data, 0, 'xar!')) return makeCandidate('xar', 0.98, true, 'signature', 'xar-signature', 'XAR archive header');
  if (hasBytes(data, 0, [0xed, 0xab, 0xee, 0xdb])) return makeCandidate('rpm', 0.98, true, 'signature', 'rpm-signature', 'RPM package header');
  if (hasBytes(data, 0, [0x78, 0x9f, 0x3e, 0x22])) return makeCandidate('tnef', 0.98, true, 'signature', 'tnef-signature', 'TNEF header');
  if (hasBytes(data, 0, [0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x87, 0x0a])) return makeCandidate('jp2', 0.99, true, 'signature', 'jp2-signature', 'JPEG 2000 signature box');
  if (hasAscii(data, 0, '8BPS')) return makeCandidate('psd', 0.98, true, 'signature', 'psd-signature', 'Photoshop document header');
  if (hasAscii(data, 0, 'SQLite format 3\0')) return makeCandidate('sqlite', 0.99, true, 'signature', 'sqlite-signature', 'SQLite 3 database header');
  if (hasAscii(data, 0, 'PAR1')) {
    const footerOffset = source.size - 4;
    const hasFooter = footerOffset >= 4 && hasAscii(source.read(footerOffset, 4), 0, 'PAR1');
    return hasFooter
      ? makeCandidate('parquet', 0.99, true, 'signature', 'parquet-header-footer', 'Apache Parquet magic header and footer', footerOffset)
      : makeCandidate('parquet', 0.9, false, 'signature', 'parquet-header', 'Apache Parquet magic header without a readable footer');
  }
  if (hasAscii(data, 0, 'Cr24')) return makeCandidate('crx', 0.98, true, 'signature', 'crx-signature', 'Chrome extension package header');
  if (hasAscii(data, 0, 'glTF')) return makeCandidate('glb', 0.99, true, 'signature', 'glb-signature', 'Binary glTF header');
  if (hasAscii(data, 0, 'bplist00')) return makeCandidate('plist', 0.98, true, 'signature', 'binary-plist-signature', 'Binary property list header');
  if (data.length >= 68 && hasAscii(data, 60, 'BOOKMOBI')) return makeCandidate('mobi', 0.95, true, 'signature', 'mobi-bookmobi', 'Mobipocket BOOKMOBI marker', 60);
  if (hasBytes(data, 0, [0x7f, 0x45, 0x4c, 0x46])) return makeCandidate('elf', 0.99, true, 'signature', 'elf-signature', 'ELF header');
  if (hasBytes(data, 0, [0xca, 0xfe, 0xba, 0xbe])) {
    const architectureCount = u32be(data, 4);
    if (architectureCount !== null && architectureCount > 0 && architectureCount <= 32 && data.length >= 8 + architectureCount * 20) {
      return makeCandidate('macho', 0.98, true, 'signature', 'macho-fat-signature', 'Mach-O universal binary header');
    }
    return makeCandidate('class', 0.99, true, 'signature', 'java-class-signature', 'Java class header');
  }
  if (hasAscii(data, 0, 'dex\n')) return makeCandidate('dex', 0.99, true, 'signature', 'dex-signature', 'DEX header');
  if (hasBytes(data, 0, [0, 0x61, 0x73, 0x6d])) return makeCandidate('wasm', 0.99, true, 'signature', 'wasm-signature', 'WebAssembly header');
  if (hasAscii(data, 0, 'wOFF')) return makeCandidate('woff', 0.99, true, 'signature', 'woff-signature', 'WOFF header');
  if (hasAscii(data, 0, 'wOF2')) return makeCandidate('woff2', 0.99, true, 'signature', 'woff2-signature', 'WOFF2 header');
  if (hasAscii(data, 0, 'OTTO')) return makeCandidate('otf', 0.99, true, 'signature', 'otf-signature', 'OpenType header');
  if (hasBytes(data, 0, [0, 1, 0, 0])) return makeCandidate('ttf', 0.99, true, 'signature', 'ttf-signature', 'TrueType header');
  if (hasAscii(data, 257, 'ustar') && data.length >= 262) return makeCandidate('tar', 0.98, true, 'signature', 'tar-ustar', 'USTAR marker', 257);
  if (hasAscii(data, 0, '070701') || hasAscii(data, 0, '070702')) return makeCandidate('cpio', 0.98, true, 'signature', 'cpio-signature', 'CPIO header');
  if (hasAscii(data, 0, '!<arch>\n')) {
    return data.includes(Buffer.from('debian-binary', 'ascii'))
      ? makeCandidate('deb', 0.98, true, 'signature', 'deb-ar-signature', 'Debian package ar archive')
      : makeCandidate('ar', 0.98, true, 'signature', 'ar-signature', 'Unix ar archive header');
  }
  if (hasAscii(data, 0, '%PDF-')) return makeCandidate('pdf', 0.99, true, 'signature', 'pdf-header', 'PDF header');
  if (hasAscii(data, 0, '{\\rtf')) return makeCandidate('rtf', 0.98, true, 'signature', 'rtf-header', 'RTF header');
  if (hasBytes(data, 0, [0x00, 0x00, 0x01, 0xba]) || hasBytes(data, 0, [0x00, 0x00, 0x01, 0xb3])) return makeCandidate('mpeg', 0.9, true, 'signature', 'mpeg-start-code', 'MPEG start code');
  if (hasBytes(data, 0, CFB_SIGNATURE)) return makeCandidate('ole', 0.99, true, 'signature', 'ole-signature', 'Compound File Binary signature');
  if (hasAscii(data, 0, 'PK\x03\x04') || hasAscii(data, 0, 'PK\x05\x06') || hasAscii(data, 0, 'PK\x07\x08')) return makeCandidate('zip', 0.99, true, 'signature', 'zip-signature', 'ZIP local header, empty archive, or data descriptor');

  if (hasAscii(data, 0, 'MZ')) {
    const peOffset = u32le(data, 0x3c);
    if (peOffset !== null && peOffset + 4 <= source.size && hasAscii(source.read(peOffset, 4), 0, 'PE\0\0')) {
      return makeCandidate('pe', 0.99, true, 'signature', 'pe-header', 'MZ header followed by PE signature', peOffset);
    }
    return makeCandidate('pe', 0.75, false, 'signature', 'mz-header', 'MZ executable header without a readable PE header');
  }

  if (hasBytes(data, 0, [0xfe, 0xed, 0xfa, 0xce]) || hasBytes(data, 0, [0xce, 0xfa, 0xed, 0xfe]) || hasBytes(data, 0, [0xfe, 0xed, 0xfa, 0xcf]) || hasBytes(data, 0, [0xcf, 0xfa, 0xed, 0xfe]) || hasBytes(data, 0, [0xca, 0xfe, 0xba, 0xbf])) {
    return makeCandidate('macho', 0.98, true, 'signature', 'macho-signature', 'Mach-O or universal binary header');
  }
  if (hasAscii(data, 4, 'ftyp') && data.length >= 12) {
    const brand = data.subarray(8, 12).toString('ascii');
    if (brand.startsWith('3g')) return makeCandidate('3gp', 0.96, true, 'signature', '3gpp-ftyp', 'ISO base media container with a 3GPP brand');
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1'].includes(brand)) return makeCandidate('heif', 0.98, true, 'signature', 'heif-ftyp', 'ISO base media container with an HEIF brand');
    if (brand === 'M4A ' || brand === 'M4B ') return makeCandidate('m4a', 0.96, true, 'signature', 'm4a-ftyp', 'ISO base media container with an MPEG-4 audio brand');
    if (brand === 'qt  ') return makeCandidate('mov', 0.97, true, 'signature', 'quicktime-ftyp', 'QuickTime media container');
    if (brand === 'avif' || brand === 'avis') return makeCandidate('avif', 0.98, true, 'signature', 'avif-ftyp', 'ISO base media container with AVIF brand');
    return makeCandidate('mp4', 0.95, true, 'signature', 'mp4-ftyp', 'ISO base media container');
  }

  if (source.size >= 512 && hasAscii(source.read(source.size - 512, 4), 0, 'koly')) {
    return makeCandidate('dmg', 0.95, true, 'signature', 'dmg-koly-footer', 'Apple disk image koly footer', source.size - 512);
  }

  const iso = detectIso(data, source.size);
  if (iso) return iso;
  return null;
};
