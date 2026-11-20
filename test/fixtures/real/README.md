# Real format fixtures

These files are small, self-contained fixtures used by the integration tests. They contain complete format structures where a compact fixture is practical:

- the image fixtures are 1-pixel PNG, GIF, and JPEG files;
- `sample.pdf` is a valid minimal PDF document;
- `sample.wav` is a valid empty PCM WAV container;
- `sample.gz` is a gzip stream containing text;
- `sample.tar` is a USTAR archive containing one file;
- Office, JAR, EPUB, IPA, and VSIX fixtures are valid stored ZIP archives with the identifying entries required by each container format;
- `sample.sqlite` is created by Python's standard SQLite implementation and contains one table and one row;
- `sample.wasm` is the valid empty WebAssembly module;
- SVG and EML fixtures are complete text documents.
- CSV, INI, PostScript, and glTF fixtures are complete text documents, while the GLB and binary property-list fixtures are valid compact binary documents.
- 3GPP, AAC, JPEG 2000, MOBI, MPEG, and SWF fixtures contain the corresponding format signatures and compact header structures used for content detection.
- ODT, ODS, and ODP fixtures are stored OpenDocument ZIP packages with their standard `mimetype` entries; the Parquet fixture contains matching `PAR1` header and footer markers.
- BMP, CUR, FLAC, ICO, MIDI, MP3, MP4, TIFF, WebM, and WebP fixtures exercise the corresponding common media and image signatures.

The tests pass an unrelated filename to the buffer API so the expected results come from file contents and container structure.
